"use client";

import { SUBJECTS, type Student, type SubjectId } from "@/lib/types";

interface StudentCardProps {
  student: Student;
  activeSubject: SubjectId;
  onGradeChange: (studentId: string, subjectId: SubjectId, grade: number) => void;
  onRemove: (studentId: string) => void;
}

export function StudentCard({
  student,
  activeSubject,
  onGradeChange,
  onRemove,
}: StudentCardProps) {
  const currentGrade = student.grades[activeSubject] || 0;
  const subject = SUBJECTS.find((s) => s.id === activeSubject)!;

  const averageGrade = (() => {
    const grades = Object.values(student.grades).filter((g) => g > 0);
    if (grades.length === 0) return 0;
    return grades.reduce((a, b) => a + b, 0) / grades.length;
  })();

  return (
    <div className="group relative glass-card rounded-2xl p-3.5 sm:p-4 transition-all duration-200 hover:shadow-xl hover:border-rose-500/40 hover:-translate-y-0.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
      {/* Left: Student Info & Delete */}
      <div className="flex items-center justify-between lg:justify-start gap-3 min-w-[240px]">
        <div className="flex items-center gap-3">
          {/* Avatar with gradient & subtle ring */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-rose-700 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center font-black text-rose-600 dark:text-rose-300 text-base">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center shadow-xs">
              {student.gradeLevel || "5"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight tracking-tight">
                {student.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                {student.gradeLevel || "5"}. Sınıf
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
              {averageGrade > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Genel Ort:{" "}
                  <strong className="text-foreground font-extrabold">{averageGrade.toFixed(1)}</strong>
                </span>
              ) : (
                <span className="text-muted-foreground/80 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  Henüz not yok
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete Student Action */}
        <button
          onClick={() => onRemove(student.id)}
          className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center cursor-pointer shrink-0 lg:order-last active:scale-95"
          title="Öğrenciyi Sil"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Right: Grade Status & Exact Square 1-10 Buttons */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-2xl border ${subject.borderColor} ${subject.bgColor} p-2 sm:px-3.5 transition-all duration-200`}>
        {/* Subject & Score Indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${subject.color}`} />
            <span className={`text-xs font-bold ${subject.textColor}`}>{subject.name}:</span>
          </div>
          {currentGrade > 0 ? (
            <span className={`text-xs font-black ${subject.textColor} px-2 py-0.5 rounded-lg bg-card/90 shadow-xs border ${subject.borderColor} tracking-tight`}>
              {currentGrade} / 10
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-background/50">
              Not Yok
            </span>
          )}
        </div>

        {/* 1 to 10 Exact Square Buttons with Tactile Elevation */}
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5 w-full sm:w-auto">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((grade) => {
            const isSelected = currentGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => onGradeChange(student.id, activeSubject, grade)}
                className={`
                  w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer
                  border flex items-center justify-center select-none
                  ${
                    isSelected
                      ? `bg-gradient-to-br ${subject.color} text-white shadow-md scale-105 border-transparent ring-2 ring-rose-500/40 font-black`
                      : `bg-card text-foreground border-border hover:border-rose-500/50 hover:bg-rose-500/10 dark:hover:bg-rose-400/10 hover:scale-105 active:scale-95`
                  }
                `}
                title={`${grade} Puan Ver`}
              >
                {grade}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
