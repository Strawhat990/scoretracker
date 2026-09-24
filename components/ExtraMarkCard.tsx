"use client";

import { CSSProperties } from "react";
import { clampInput } from "@/lib/grading";

interface ExtraMarkCardProps {
  label: string;
  shortLabel: string;
  maxMarks: number;
  value: number | null;
  accent: string;
  glow: string;
  onChange: (value: number | null) => void;
}

export default function ExtraMarkCard({
  label,
  shortLabel,
  maxMarks,
  value,
  accent,
  glow,
  onChange,
}: ExtraMarkCardProps) {
  const pct = value != null ? (value / maxMarks) * 100 : 0;
  const cardStyle = { "--accent": accent, "--glow": glow } as CSSProperties;

  return (
    <div className="glass-card rounded-card" style={cardStyle}>
      <div className="flex w-full items-center gap-4 px-4 py-4 sm:px-5">
        {/* Mini percentage circle */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={accent} strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
              style={{ filter: `drop-shadow(0 0 4px ${glow})`, transition: "stroke-dasharray 0.4s ease" }}
            />
          </svg>
          <span className="absolute text-[10px] font-mono font-bold text-white/90">
            {value != null ? Math.round(pct) : "—"}
          </span>
        </div>

        {/* Label */}
        <div className="min-w-0 flex-1">
          <span className="font-mono text-xs text-white/70">{shortLabel}</span>
          <h3 className="truncate font-serif text-[17px] font-semibold leading-tight text-white">
            {label}
          </h3>
        </div>

        {/* Input */}
        <div className="flex shrink-0 items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            className="glass-input w-20 text-center"
            style={cardStyle}
            placeholder="—"
            value={value ?? ""}
            onChange={(e) => onChange(clampInput(e.target.value, maxMarks))}
            onFocus={(e) => e.target.select()}
            min={0}
            max={maxMarks}
            step={0.5}
          />
          <span className="font-mono text-sm text-white/40">/{maxMarks}</span>
        </div>
      </div>
    </div>
  );
}
