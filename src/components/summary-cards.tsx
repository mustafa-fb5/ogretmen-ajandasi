"use client";

import { SUBJECTS, type Student } from "@/lib/types";

interface SummaryCardsProps {
  students: Student[];
  classHomework?: Record<string, string>; // subjectId -> text
}

export function SummaryCards({ students, classHomework = {} }: SummaryCardsProps) {
  const totalStudents = students.length;

  const subjectAverages = SUBJECTS.map((subject) => {
    const grades = students
      .map((s) => s.grades[subject.id])
      .filter((g) => g !== undefined && g > 0);
    const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const hasHomework = !!classHomework[subject.id]?.trim();
    return { ...subject, average: avg, hasHomework, gradeCount: grades.length };
  });

  const overallAverage = (() => {
    const allGrades = students.flatMap((s) => Object.values(s.grades)).filter((g) => g > 0);
    if (allGrades.length === 0) return 0;
    return allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
  })();

  return (
    <div className="space-y-3.5">
      {/* Top Telemetry Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-card rounded-2xl p-3.5 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 to-red-600" />
          <p className="text-3xl font-black bg-gradient-to-br from-rose-600 via-red-600 to-rose-900 dark:from-rose-400 dark:to-red-300 bg-clip-text text-transparent">
            {totalStudents}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
            Öğrenci
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3.5 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 to-rose-600" />
          <p className="text-3xl font-black bg-gradient-to-br from-rose-600 via-red-600 to-rose-900 dark:from-rose-400 dark:to-red-300 bg-clip-text text-transparent">
            {overallAverage > 0 ? overallAverage.toFixed(1) : "-"}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
            Genel Ort.
          </p>
        </div>
      </div>

      {/* Subject Stats */}
      <div className="space-y-2">
        {subjectAverages.map((subject) => (
          <div
            key={subject.id}
            className={`glass-card rounded-2xl p-3 border transition-all duration-200 hover:shadow-md hover:border-rose-500/30 ${subject.bgColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${subject.color} shadow-xs`} />
                <span className={`text-xs font-bold ${subject.textColor}`}>{subject.name}</span>
              </div>
              <span className={`text-base font-black ${subject.textColor}`}>
                {subject.average > 0 ? subject.average.toFixed(1) : "-"}
                {subject.average > 0 && <span className="text-[10px] opacity-70"> /10</span>}
              </span>
            </div>

            {/* Modern Animated Progress bar */}
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${subject.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, (subject.average / 10) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-[10px] font-medium">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{subject.gradeCount}</strong>/{totalStudents} notlu
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  subject.hasHomework
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {subject.hasHomework ? "Ödev Var" : "Ödev Yok"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

