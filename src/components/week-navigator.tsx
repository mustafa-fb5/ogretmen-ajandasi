"use client";

import { formatWeekRange } from "@/lib/helpers";

interface WeekNavigatorProps {
  weekStart: Date;
  weekEnd: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export function WeekNavigator({
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekNavigatorProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      {/* Prev Button */}
      <button
        onClick={onPrevWeek}
        className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-card hover:bg-rose-500/10 dark:hover:bg-rose-400/10 border border-rose-500/20 text-foreground transition-all duration-200 text-xs sm:text-sm font-semibold cursor-pointer active:scale-95 hover:shadow-md"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-rose-600 dark:text-rose-400 group-hover:-translate-x-0.5 transition-transform"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="hidden sm:inline">Önceki Hafta</span>
      </button>

      {/* Date Display Pill */}
      <div className="text-center px-4 py-1.5 rounded-2xl glass-card border border-rose-500/20 shadow-xs flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-foreground">
            {formatWeekRange(weekStart, weekEnd)}
          </h2>
        </div>
        {!isCurrentWeek && (
          <button
            onClick={onCurrentWeek}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors mt-0.5 cursor-pointer underline decoration-rose-500/40 underline-offset-2"
          >
            Bu Haftaya Dön
          </button>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={onNextWeek}
        className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-card hover:bg-rose-500/10 dark:hover:bg-rose-400/10 border border-rose-500/20 text-foreground transition-all duration-200 text-xs sm:text-sm font-semibold cursor-pointer active:scale-95 hover:shadow-md"
      >
        <span className="hidden sm:inline">Sonraki Hafta</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

