"use client";

import { useState, useRef, useEffect } from "react";
import { GRADE_LEVELS, type GradeLevel } from "@/lib/types";

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, gradeLevel: GradeLevel) => void;
  defaultGradeLevel?: GradeLevel;
}

export function AddStudentDialog({
  isOpen,
  onClose,
  onAdd,
  defaultGradeLevel = "5",
}: AddStudentDialogProps) {
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(defaultGradeLevel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setGradeLevel(defaultGradeLevel);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultGradeLevel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), gradeLevel);
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with ultra blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog Card with Glassmorphic specular highlight */}
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-rose-500/25 shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Ambient glow accent inside modal */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 relative">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">Yeni Öğrenci Ekle</h2>
              <p className="text-xs text-muted-foreground font-medium">Öğrencinin adını ve kayıtlı olduğu sınıfı belirleyin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block uppercase tracking-wider">
                Sınıf Seçimi
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRADE_LEVELS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGradeLevel(g.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                      gradeLevel === g.id
                        ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-transparent shadow-md shadow-rose-500/25 scale-102 ring-2 ring-rose-500/30"
                        : "bg-background/80 border-border text-foreground hover:bg-rose-500/10 hover:border-rose-500/30"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block uppercase tracking-wider">
                Öğrenci Adı ve Soyadı
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ayşe Yılmaz"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/90 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all font-medium text-sm"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all cursor-pointer active:scale-95"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 text-white hover:shadow-lg hover:shadow-rose-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 hover:scale-[1.02]"
              >
                Kaydet & Ekle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

