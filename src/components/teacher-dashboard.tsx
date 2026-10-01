"use client";

import { useState, useEffect, useCallback } from "react";
import { WeekNavigator } from "@/components/week-navigator";
import { StudentCard } from "@/components/student-card";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { SummaryCards } from "@/components/summary-cards";
import { ClassHomework } from "@/components/class-homework";
import type { WeekData, SubjectId, GradeLevel } from "@/lib/types";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/types";
import {
  getWeekDates,
  getWeekId,
  createNewWeekData,
  createNewStudent,
  saveWeekData,
  subscribeToWeekData,
  getMasterStudents,
  saveMasterStudents,
  subscribeToMasterStudents,
} from "@/lib/helpers";

export function TeacherDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | "all">("all");
  const [activeSubject, setActiveSubject] = useState<SubjectId>("turkce");

  const { start: weekStart, end: weekEnd } = getWeekDates(currentDate);
  const weekId = getWeekId(currentDate);

  // Subscribe to Firebase master students & week data
  useEffect(() => {
    setIsLoading(true);

    // 1. Subscribe to permanent master student list in Firestore
    const unsubMaster = subscribeToMasterStudents((masterStudents) => {
      setWeekData((prev) => {
        if (!prev) return prev;
        const existingIds = new Set(prev.students.map((s) => s.id));
        const missing = masterStudents
          .filter((ms) => !existingIds.has(ms.id))
          .map((ms) => ({
            id: ms.id,
            name: ms.name,
            gradeLevel: ms.gradeLevel || "5",
            grades: {},
            homework: {},
          }));
        if (missing.length === 0) return prev;
        return {
          ...prev,
          students: [...prev.students, ...missing],
        };
      });
    });

    // 2. Subscribe to current week data in Firestore
    const unsubWeek = subscribeToWeekData(weekId, (data) => {
      const masterStudents = getMasterStudents();

      if (data) {
        // Ensure all master students exist in this weekData
        const existingStudentIds = new Set(data.students.map((s) => s.id));
        const missingStudents = masterStudents
          .filter((ms) => !existingStudentIds.has(ms.id))
          .map((ms) => ({
            id: ms.id,
            name: ms.name,
            gradeLevel: ms.gradeLevel || "5",
            grades: {},
            homework: {},
          }));

        const mergedWeekData: WeekData = {
          ...data,
          students: [...data.students, ...missingStudents],
        };

        setWeekData(mergedWeekData);

        // Also ensure master student list contains any students that existed in data
        if (data.students.length > 0) {
          const masterMap = new Map(masterStudents.map((s) => [s.id, s]));
          let masterChanged = false;
          data.students.forEach((s) => {
            if (!masterMap.has(s.id)) {
              masterMap.set(s.id, s);
              masterChanged = true;
            }
          });
          if (masterChanged) {
            saveMasterStudents(Array.from(masterMap.values()));
          }
        }
      } else {
        const newWeek = createNewWeekData(currentDate);
        setWeekData(newWeek);
      }
      setIsLoading(false);
    });

    return () => {
      unsubMaster();
      unsubWeek();
    };
  }, [weekId, currentDate]);

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  // Auto-save to Firebase
  const saveData = useCallback(
    async (data: WeekData) => {
      setIsSaving(true);
      try {
        await saveWeekData(data);
      } catch (error) {
        console.error("Kaydetme hatası:", error);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleAddStudent = useCallback(
    (name: string, gradeLevel: GradeLevel) => {
      if (!weekData) return;
      const newStudent = createNewStudent(name, gradeLevel);
      const updatedStudents = [...weekData.students, newStudent];
      const updated = {
        ...weekData,
        students: updatedStudents,
      };
      setWeekData(updated);
      saveData(updated);
      
      // Update master student list so student permanently exists across all weeks
      const currentMaster = getMasterStudents();
      saveMasterStudents([...currentMaster.filter((s) => s.id !== newStudent.id), newStudent]);
    },
    [weekData, saveData]
  );

  const handleRemoveStudent = useCallback(
    (studentId: string) => {
      if (!weekData) return;
      const updatedStudents = weekData.students.filter((s) => s.id !== studentId);
      const updated = {
        ...weekData,
        students: updatedStudents,
      };
      setWeekData(updated);
      saveData(updated);

      // Remove from master list
      const currentMaster = getMasterStudents();
      saveMasterStudents(currentMaster.filter((s) => s.id !== studentId));
    },
    [weekData, saveData]
  );

  const handleGradeChange = useCallback(
    (studentId: string, subjectId: SubjectId, grade: number) => {
      if (!weekData) return;
      const updated = {
        ...weekData,
        students: weekData.students.map((s) =>
          s.id === studentId
            ? { ...s, grades: { ...s.grades, [subjectId]: s.grades[subjectId] === grade ? 0 : grade } }
            : s
        ),
      };
      setWeekData(updated);
      saveData(updated);
    },
    [weekData, saveData]
  );

  const handleClassHomeworkChange = useCallback(
    (gradeLevel: GradeLevel, subjectId: SubjectId, text: string) => {
      if (!weekData) return;
      const prevClassHw = weekData.classHomework || {};
      const prevGradeHw = prevClassHw[gradeLevel] || {};
      const updated = {
        ...weekData,
        classHomework: {
          ...prevClassHw,
          [gradeLevel]: {
            ...prevGradeHw,
            [subjectId]: text,
          },
        },
      };
      setWeekData(updated);
      const timeout = setTimeout(() => saveData(updated), 500);
      return () => clearTimeout(timeout);
    },
    [weekData, saveData]
  );

  const navigateWeek = (direction: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7 * direction);
    setCurrentDate(d);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-500/10 via-background to-red-500/10 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative static blurred red bubbles (hareketsiz bulanık kırmızı baloncuklar) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Large atmospheric ambient glow orbs */}
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[30rem] h-[30rem] rounded-full bg-red-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-4 w-80 h-80 rounded-full bg-rose-400/15 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 w-[32rem] h-[32rem] rounded-full bg-red-600/15 blur-3xl" />
        <div className="absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-rose-600/15 blur-3xl" />

        {/* Medium and small aesthetic glass bubbles */}
        <div className="absolute top-20 right-1/3 w-40 h-40 rounded-full bg-rose-400/25 blur-xl border border-rose-300/30 shadow-lg shadow-rose-500/15" />
        <div className="absolute top-3/5 right-16 w-48 h-48 rounded-full bg-red-400/20 blur-xl border border-red-300/20" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-rose-500/25 blur-lg border border-rose-300/30" />
        <div className="absolute bottom-1/3 left-2/5 w-44 h-44 rounded-full bg-orange-500/15 blur-xl" />
        <div className="absolute top-14 left-1/2 w-24 h-24 rounded-full bg-rose-400/30 blur-md" />
        <div className="absolute bottom-1/4 right-1/3 w-28 h-28 rounded-full bg-red-500/20 blur-lg" />
      </div>

      {/* Header - Floating 2026 Glass Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-rose-500/15 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-rose-500/25 border-2 border-rose-500/30 flex items-center justify-center bg-white shrink-0">
                <img
                  src="/logo.png"
                  alt="Öğretmen Ajandası Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-rose-600 via-red-600 to-rose-800 dark:from-rose-400 dark:via-red-300 dark:to-orange-300 bg-clip-text text-transparent tracking-tight">
                    Öğretmen Ajandası
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    2026 Pro
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Haftalık Not & Ödev Takip Platformu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Saving indicator */}
              {isSaving && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-full animate-pulse font-semibold">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="hidden sm:inline">Kaydediliyor...</span>
                </div>
              )}

              {/* Summary toggle (mobile) */}
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="lg:hidden w-10 h-10 rounded-xl glass-card border border-rose-500/20 flex items-center justify-center hover:bg-rose-500/10 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Özet Paneli"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                  <path d="m7 11 4-4 4 4 4-4" />
                </svg>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="w-10 h-10 rounded-xl glass-card border border-rose-500/20 flex items-center justify-center hover:bg-rose-500/10 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Görünüm Modu"
              >
                {isDark ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                    <path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Week Navigator */}
          <WeekNavigator
            weekStart={weekStart}
            weekEnd={weekEnd}
            onPrevWeek={() => navigateWeek(-1)}
            onNextWeek={() => navigateWeek(1)}
            onCurrentWeek={() => setCurrentDate(new Date())}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Class Filter Tabs - Segmented Pill Control */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-none">
          <button
            onClick={() => setSelectedGrade("all")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap border select-none ${
              selectedGrade === "all"
                ? "bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 text-white border-transparent shadow-lg shadow-rose-500/30 scale-102 ring-2 ring-rose-500/30"
                : "glass-card border-rose-500/20 text-foreground hover:bg-rose-500/10 hover:border-rose-500/40 shadow-xs"
            }`}
          >
            <span>Tüm Sınıflar</span>
            {weekData && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                selectedGrade === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {weekData.students.length}
              </span>
            )}
          </button>

          {GRADE_LEVELS.map((g) => {
            const count = weekData?.students.filter((s) => (s.gradeLevel || "5") === g.id).length || 0;
            const isSelected = selectedGrade === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap border select-none ${
                  isSelected
                    ? "bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 text-white border-transparent shadow-lg shadow-rose-500/30 scale-102 ring-2 ring-rose-500/30"
                    : "glass-card border-rose-500/20 text-foreground hover:bg-rose-500/10 hover:border-rose-500/40 shadow-xs"
                }`}
              >
                <span>{g.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Central Subject Selector - 2026 Floating Control Bar */}
            <div className="glass-card rounded-2xl p-3.5 sm:p-4 mb-5 shadow-xs border border-rose-500/25">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">
                    Not Girişi Yapılacak Ders:
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  Aşağıdaki tüm öğrenci kartlarında bu dersin not butonları etkindir
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBJECTS.map((sub) => {
                  const isSelected = activeSubject === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubject(sub.id)}
                      className={`
                        relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer border select-none
                        ${
                          isSelected
                            ? `bg-gradient-to-r ${sub.color} text-white border-transparent shadow-lg scale-102 ring-2 ring-rose-500/40 font-black`
                            : `${sub.bgColor} ${sub.textColor} ${sub.borderColor} hover:scale-101 hover:brightness-105`
                        }
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : `bg-gradient-to-r ${sub.color}`}`} />
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Students List Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  {selectedGrade === "all"
                    ? "Tüm Öğrenciler"
                    : `${selectedGrade}. Sınıf Öğrencileri`}
                </h2>
                {weekData && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {
                      weekData.students.filter(
                        (s) => selectedGrade === "all" || (s.gradeLevel || "5") === selectedGrade
                      ).length
                    }
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 text-white text-xs sm:text-sm font-extrabold hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="5" y2="19" />
                  <line x1="5" x2="19" y1="12" y2="12" />
                </svg>
                <span>Öğrenci Ekle</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yükleniyor...</p>
                </div>
              </div>
            ) : weekData && weekData.students.filter((s) => selectedGrade === "all" || (s.gradeLevel || "5") === selectedGrade).length > 0 ? (
              <div className="flex flex-col gap-3">
                {weekData.students
                  .filter((s) => selectedGrade === "all" || (s.gradeLevel || "5") === selectedGrade)
                  .map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      activeSubject={activeSubject}
                      onGradeChange={handleGradeChange}
                      onRemove={handleRemoveStudent}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-3xl border border-dashed border-rose-500/40 p-8 shadow-sm">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 via-red-500/20 to-rose-600/10 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400 shadow-inner">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-foreground mb-1 tracking-tight">
                  {selectedGrade === "all"
                    ? "Henüz öğrenci kaydı yok"
                    : `${selectedGrade}. sınıfta henüz öğrenci bulunmuyor`}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-5 max-w-sm">
                  {selectedGrade === "all"
                    ? "Öğrenci ekleyerek haftalık ders notlarını ve ödevleri yönetmeye başlayın."
                    : `Bu sınıfa öğrenci ekleyerek ders notu ve ödev takibine başlayın.`}
                </p>
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 text-white text-xs sm:text-sm font-extrabold hover:shadow-lg hover:shadow-rose-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Öğrenci Ekle
                </button>
              </div>
            )}

            {/* Class Homework Section - Placed at the bottom of student list */}
            <div className="mt-8">
              {selectedGrade !== "all" ? (
                <ClassHomework
                  gradeLevel={selectedGrade}
                  activeSubject={activeSubject}
                  homework={weekData?.classHomework?.[selectedGrade] || {}}
                  onHomeworkChange={handleClassHomeworkChange}
                  onSelectSubject={setActiveSubject}
                />
              ) : (
                <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-rose-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">Sınıf Bazlı Ödev Girişi</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Ödev girmek ve düzenlemek için yukarıdaki sekmelerden bir sınıf seçin.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {GRADE_LEVELS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrade(g.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer active:scale-95"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <aside
            className={`
              lg:w-80 lg:block
              ${showSummary ? "block" : "hidden"}
            `}
          >
            <div className="sticky top-[220px]">
              <h2 className="text-lg font-bold text-foreground mb-4">
                {selectedGrade === "all" ? "Genel Özet" : `${selectedGrade}. Sınıf Özeti`}
              </h2>
              <SummaryCards
                students={
                  (weekData?.students || []).filter(
                    (s) => selectedGrade === "all" || (s.gradeLevel || "5") === selectedGrade
                  )
                }
                classHomework={
                  selectedGrade !== "all"
                    ? weekData?.classHomework?.[selectedGrade] || {}
                    : {}
                }
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Add Student Dialog */}
      <AddStudentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddStudent}
        defaultGradeLevel={selectedGrade === "all" ? "5" : selectedGrade}
      />
    </div>
  );
}
