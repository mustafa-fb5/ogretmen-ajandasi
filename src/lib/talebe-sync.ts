/**
 * Firebase Realtime Database Entegrasyonu (ogrenci-takip-b5435)
 * Öğretmen Ajandası'ndaki ders notlarını ilgili günün 'takviye' puanına anlık yazar.
 *
 * Ders - Gün Eşleştirmesi:
 * - Fen Bilgisi  -> Pazartesi (Monday)
 * - İngilizce    -> Salı (Tuesday)
 * - Türkçe       -> Çarşamba (Wednesday)
 * - Matematik    -> Perşembe (Thursday)
 * - Sosyal       -> Cuma (Friday)
 */

import type { SubjectId } from "./types";

const RTDB_URL = "https://ogrenci-takip-b5435-default-rtdb.firebaseio.com";

// Derslerin karşılık geldiği haftanın günü (Pazar başlangıçlı haftada: Pzt=1, Sal=2, Çar=3, Per=4, Cum=5)
const SUBJECT_DAY_OFFSET: Record<SubjectId, number> = {
  fen: 1,       // Pazartesi
  ingilizce: 2, // Salı
  turkce: 3,    // Çarşamba
  matematik: 4, // Perşembe
  sosyal: 5,    // Cuma
};

/**
 * Verilen haftanın Pazartesi tarihinden (weekStart veya weekId),
 * o haftanın Pazar başlangıç tarihini ve ilgili günün YYYY-MM-DD anahtarını hesaplar.
 */
function calculateDayAndWeekKeys(weekStartDateStr: string, dayOffset: number) {
  // weekStartDateStr öğretmen ajandasında pazartesi günüdür (örn: "2026-10-26")
  const parts = weekStartDateStr.split("-").map(Number);
  const mondayDate = new Date(parts[0], parts[1] - 1, parts[2]);

  // ogrenci-takip sistemi haftayı Pazar gününden başlatır (Pazartesi'den 1 gün önce)
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() - 1);

  const pad = (n: number) => String(n).padStart(2, "0");
  const weekKey = `${sundayDate.getFullYear()}-${pad(sundayDate.getMonth() + 1)}-${pad(sundayDate.getDate())}`;

  // Hedef gün tarihi (Pazar + dayOffset)
  const targetDate = new Date(sundayDate);
  targetDate.setDate(sundayDate.getDate() + dayOffset);
  const dayKey = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

  return { weekKey, dayKey };
}

/**
 * Tek bir öğrencinin değişen notunu Talebe Takip sistemine anlık senkronize eder.
 */
export async function syncSingleGradeToTalebeTakip(
  studentName: string,
  weekStartDateStr: string,
  subjectId: SubjectId,
  grade: number
): Promise<void> {
  const dayOffset = SUBJECT_DAY_OFFSET[subjectId];
  if (dayOffset === undefined) return;

  const { weekKey, dayKey } = calculateDayAndWeekKeys(weekStartDateStr, dayOffset);
  const encodedStudent = encodeURIComponent(studentName.trim());
  
  // Eğer not 0 veya geçersizse takviye puanını sıfırlar / siler veya 0 yazar.
  // ogrenci-takip sisteminde puan number veya false olabilir.
  const scoreValue = grade > 0 ? grade : false;

  const targetUrl = `${RTDB_URL}/puanlama_sistemi/records/${weekKey}/${encodedStudent}/days/${dayKey}/takviye.json`;

  try {
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scoreValue),
    });

    if (!res.ok) {
      console.warn("Talebe Takip senkronizasyon yanıtı başarısız:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Talebe Takip anlık aktarım hatası:", error);
  }
}

/**
 * Bir haftadaki tüm öğrencilerin notlarını toplu olarak Talebe Takip sistemine aktarır.
 */
export async function syncAllWeekGradesToTalebeTakip(
  students: Array<{ name: string; grades?: Record<string, number> }>,
  weekStartDateStr: string
): Promise<void> {
  for (const student of students) {
    if (!student.name || !student.grades) continue;
    for (const [subject, grade] of Object.entries(student.grades)) {
      if (grade !== undefined && grade !== null) {
        await syncSingleGradeToTalebeTakip(
          student.name,
          weekStartDateStr,
          subject as SubjectId,
          grade
        );
      }
    }
  }
}

