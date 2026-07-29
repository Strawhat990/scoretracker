export interface SubjectColor {
  accent: string; // solid hex, used for text/ring/border
  glow: string; // rgba, used for box-shadow / drop-shadow blur
  soft: string; // rgba, low-opacity tint for backgrounds
}

// One signature colour per subject, carried consistently across the
// seal ring, card edge glow, inputs, and progress bar — so a subject
// is recognizable by colour alone, the way a highlighter system works
// on a real mark sheet.
export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  MBA131: { accent: "#60A5FA", glow: "rgba(96,165,250,0.55)", soft: "rgba(96,165,250,0.12)" }, // blue
  MBA132: { accent: "#C084FC", glow: "rgba(192,132,252,0.55)", soft: "rgba(192,132,252,0.12)" }, // violet
  MBA133: { accent: "#F472B6", glow: "rgba(244,114,182,0.55)", soft: "rgba(244,114,182,0.12)" }, // pink
  MBA134: { accent: "#2DD4BF", glow: "rgba(45,212,191,0.55)", soft: "rgba(45,212,191,0.12)" }, // teal
  MBA135: { accent: "#FBBF24", glow: "rgba(251,191,36,0.55)", soft: "rgba(251,191,36,0.12)" }, // amber
  MBA136: { accent: "#4ADE80", glow: "rgba(74,222,128,0.55)", soft: "rgba(74,222,128,0.12)" }, // green
};

const FALLBACK: SubjectColor = {
  accent: "#93C5FD",
  glow: "rgba(147,197,253,0.5)",
  soft: "rgba(147,197,253,0.12)",
};

export function getSubjectColor(code: string): SubjectColor {
  return SUBJECT_COLORS[code] ?? FALLBACK;
}
