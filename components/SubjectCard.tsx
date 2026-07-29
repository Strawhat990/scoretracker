"use client";

import { useState, CSSProperties } from "react";
import { Subject, Marks } from "@/types";
import { MAX, clampInput, computeGrade } from "@/lib/grading";
import { getSubjectColor } from "@/lib/subjectColors";
import ProgressSeal from "./ProgressSeal";

interface SubjectCardProps {
  subject: Subject;
  marks: Partial<Marks>;
  onChange: (field: keyof Marks, value: number | null) => void;
  defaultOpen?: boolean;
}

const FIELDS: {
  key: keyof Pick<Marks, "cia1" | "cia2" | "class_participation" | "cia3">;
  label: string;
  max: number;
}[] = [
  { key: "cia1", label: "CIA 1", max: MAX.cia1 },
  { key: "cia2", label: "CIA 2 (Mid Sem)", max: MAX.cia2 },
  { key: "class_participation", label: "Class Participation", max: MAX.class_participation },
  { key: "cia3", label: "CIA 3", max: MAX.cia3 },
];

export default function SubjectCard({ subject, marks, onChange, defaultOpen }: SubjectCardProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const grade = computeGrade(marks);
  const color = getSubjectColor(subject.code);

  const cardStyle = {
    "--accent": color.accent,
    "--glow": color.glow,
  } as CSSProperties;

  return (
    <div className={`glass-card rounded-card ${open ? "is-open" : ""}`} style={cardStyle}>
      {/* Header row — always visible, tap to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
      >
        <ProgressSeal percentage={grade.percentage} accent={color.accent} glow={color.glow} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-semibold" style={{ color: color.accent }}>
              {subject.code}
            </span>
            <span className="font-mono text-xs text-white/40">{subject.short_name}</span>
          </div>
          <h3 className="truncate font-serif text-[17px] font-semibold leading-tight text-white">
            {subject.full_name}
          </h3>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="font-mono text-lg font-semibold text-white">
            {grade.grandTotal.toFixed(1)}
            <span className="text-sm font-normal text-white/40">/100</span>
          </span>
          <svg
            className={`mt-1 h-4 w-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.07] px-4 pb-5 pt-1 sm:px-5">
          {/* Internals */}
          <div className="mb-1 mt-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Internals
            </span>
            <span className="font-mono text-xs text-white/40">
              {grade.internalTotal.toFixed(1)} / {MAX.internal_total}
            </span>
          </div>
          <div className="ledger-rule mb-3" />

          <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-[11px] font-medium text-white/40">
                  {f.label}
                  <span className="ml-1 text-white/25">/{f.max}</span>
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="glass-input"
                  style={cardStyle}
                  placeholder="—"
                  value={marks[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, clampInput(e.target.value, f.max))}
                  onFocus={(e) => e.target.select()}
                  min={0}
                  max={f.max}
                  step={0.5}
                />
              </label>
            ))}
          </div>

          {/* End Exam */}
          <div className="mb-1 mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              End Exam
            </span>
            <span className="font-mono text-xs text-white/40">
              {grade.endSemScaled.toFixed(1)} / {MAX.end_sem_scaled}
            </span>
          </div>
          <div className="ledger-rule mb-3" />

          <div className="flex items-end gap-3">
            <label className="block flex-1 max-w-[140px]">
              <span className="mb-1 block text-[11px] font-medium text-white/40">
                End Sem <span className="text-white/25">/{MAX.end_sem_raw}</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                className="glass-input"
                style={cardStyle}
                placeholder="—"
                value={marks.end_sem ?? ""}
                onChange={(e) => onChange("end_sem", clampInput(e.target.value, MAX.end_sem_raw))}
                onFocus={(e) => e.target.select()}
                min={0}
                max={MAX.end_sem_raw}
                step={0.5}
              />
            </label>
            <div className="pb-2 text-white/25">→</div>
            <div className="flex-1 max-w-[140px]">
              <span className="mb-1 block text-[11px] font-medium text-white/40">
                Scaled <span className="text-white/25">/{MAX.end_sem_scaled}</span>
              </span>
              <div
                className="rounded-[10px] border border-dashed px-2 py-2 text-center font-mono text-[15px] font-medium text-white/80"
                style={{ borderColor: "rgba(255,255,255,0.15)", background: color.soft }}
              >
                {grade.endSemScaled.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Grand total bar */}
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Grand Total
              </span>
              <span className="font-mono text-xs font-semibold text-white">
                {grade.grandTotal.toFixed(1)} / {MAX.grand_total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(grade.percentage, 100)}%`,
                  background: color.accent,
                  boxShadow: `0 0 8px ${color.glow}`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
