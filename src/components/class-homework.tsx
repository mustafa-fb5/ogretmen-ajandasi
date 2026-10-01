"use client";

import { SUBJECTS, type GradeLevel, type SubjectId } from "@/lib/types";

interface ClassHomeworkProps {
  gradeLevel: GradeLevel;
  activeSubject: SubjectId;
  homework: Record<string, string>; // subjectId -> text
  onHomeworkChange: (gradeLevel: GradeLevel, subjectId: SubjectId, text: string) => void;
  onSelectSubject?: (subjectId: SubjectId) => void;
}

export function ClassHomework({
  gradeLevel,
  activeSubject,
  homework,
  onHomeworkChange,
  onSelectSubject,
}: ClassHomeworkProps) {
  const currentSub = SUBJECTS.find((s) => s.id === activeSubject) || SUBJECTS[0];
  const filledCount = SUBJECTS.filter((s) => homework[s.id]?.trim()).length;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 mb-5 relative overflow-hidden">
      {/* Decorative subtle ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-foreground leading-tight tracking-tight">
                {gradeLevel}. Sınıf Haftalık Ödev Girişi
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/25">
                {filledCount}/{SUBJECTS.length} ders hazır
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seçili ders için haftalık ödevi yazın; anında kaydedilir ve öğrencilerle senkronize olur.
            </p>
          </div>
        </div>
      </div>

      {/* Subject Pills (Quick selector for homework) */}
      <div className="flex flex-wrap gap-1.5 mb-3.5 pt-3 border-t border-rose-500/15">
        {SUBJECTS.map((subject) => {
          const hasHomework = !!homework[subject.id]?.trim();
          const isSelected = activeSubject === subject.id;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelectSubject?.(subject.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? `bg-gradient-to-r ${subject.color} text-white border-transparent shadow-md scale-102 ring-2 ring-rose-500/30`
                  : `${subject.bgColor} ${subject.textColor} ${subject.borderColor} hover:scale-101 hover:brightness-105`
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : `bg-gradient-to-r ${subject.color}`}`} />
              <span>{subject.name}</span>
              {hasHomework && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500 shadow-xs"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Permanently Open Homework Editor for Active Subject */}
      <div className="space-y-2 bg-card/60 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-border/80">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-black ${currentSub.textColor} flex items-center gap-1.5 tracking-tight`}>
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentSub.color}`} />
            {currentSub.name} Ödevi ({gradeLevel}. Sınıf):
          </label>
          {homework[activeSubject]?.trim() ? (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Kaydedildi
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground font-medium">Ödev henüz girilmedi</span>
          )}
        </div>
        <textarea
          value={homework[activeSubject] || ""}
          onChange={(e) => onHomeworkChange(gradeLevel, activeSubject, e.target.value)}
          placeholder={`${gradeLevel}. sınıf ${currentSub.name} dersi için bu haftanın ödevini buraya yazın...`}
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background/90 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all resize-y font-normal"
        />
      </div>
    </div>
  );
}

