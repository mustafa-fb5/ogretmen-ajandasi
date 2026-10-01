export type GradeLevel = "5" | "6" | "7" | "8";

export const GRADE_LEVELS: { id: GradeLevel; name: string }[] = [
  { id: "5", name: "5. Sınıf" },
  { id: "6", name: "6. Sınıf" },
  { id: "7", name: "7. Sınıf" },
  { id: "8", name: "8. Sınıf" },
];

export interface Student {
  id: string;
  name: string;
  gradeLevel?: GradeLevel; // "5" | "6" | "7" | "8"
  grades: Record<string, number>; // subject -> grade (1-10)
  homework?: Record<string, string>; // legacy/optional
}

export interface WeekData {
  id: string;
  weekStart: string; // ISO date string
  weekEnd: string;
  students: Student[];
  classHomework?: Record<string, Record<string, string>>; // gradeLevel -> { subjectId -> homeworkText }
  createdAt: string;
}

export const SUBJECTS = [
  { id: "turkce", name: "Türkçe", color: "from-red-500 to-rose-600", bgColor: "bg-red-500/10", textColor: "text-red-500", borderColor: "border-red-500/30" },
  { id: "matematik", name: "Matematik", color: "from-blue-500 to-indigo-600", bgColor: "bg-blue-500/10", textColor: "text-blue-500", borderColor: "border-blue-500/30" },
  { id: "fen", name: "Fen Bilgisi", color: "from-emerald-500 to-green-600", bgColor: "bg-emerald-500/10", textColor: "text-emerald-500", borderColor: "border-emerald-500/30" },
  { id: "sosyal", name: "Sosyal Bilgiler", color: "from-amber-500 to-orange-600", bgColor: "bg-amber-500/10", textColor: "text-amber-500", borderColor: "border-amber-500/30" },
  { id: "ingilizce", name: "İngilizce", color: "from-purple-500 to-violet-600", bgColor: "bg-purple-500/10", textColor: "text-purple-500", borderColor: "border-purple-500/30" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];

