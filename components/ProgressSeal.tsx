"use client";

interface ProgressSealProps {
  percentage: number; // 0-100
  accent: string;
  glow: string;
  size?: number;
}

/**
 * A circular progress ring rendered in the subject's own accent
 * colour with a soft glow — the signature visual element. Colour
 * identifies the subject at a glance; fill identifies progress.
 */
export default function ProgressSeal({ percentage, accent, glow, size = 56 }: ProgressSealProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.4s ease",
            filter: `drop-shadow(0 0 6px ${glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[13px] font-semibold text-white">
          {Math.round(clamped)}
        </span>
      </div>
    </div>
  );
}
