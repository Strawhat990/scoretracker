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
  // Trimester 1
  MBA131: { accent: "#60A5FA", glow: "rgba(96,165,250,0.55)",  soft: "rgba(96,165,250,0.12)"  }, // blue
  MBA132: { accent: "#C084FC", glow: "rgba(192,132,252,0.55)", soft: "rgba(192,132,252,0.12)" }, // violet
  MBA133: { accent: "#F472B6", glow: "rgba(244,114,182,0.55)", soft: "rgba(244,114,182,0.12)" }, // pink
  MBA134: { accent: "#2DD4BF", glow: "rgba(45,212,191,0.55)",  soft: "rgba(45,212,191,0.12)"  }, // teal
  MBA135: { accent: "#FBBF24", glow: "rgba(251,191,36,0.55)",  soft: "rgba(251,191,36,0.12)"  }, // amber
  MBA136: { accent: "#4ADE80", glow: "rgba(74,222,128,0.55)",  soft: "rgba(74,222,128,0.12)"  }, // green
  // Trimester 2
  MBA231: { accent: "#FB923C", glow: "rgba(251,146,60,0.55)",  soft: "rgba(251,146,60,0.12)"  }, // orange
  MBA232: { accent: "#38BDF8", glow: "rgba(56,189,248,0.55)",  soft: "rgba(56,189,248,0.12)"  }, // sky
  MBA234: { accent: "#F87171", glow: "rgba(248,113,113,0.55)", soft: "rgba(248,113,113,0.12)" }, // rose
  MBA235: { accent: "#A3E635", glow: "rgba(163,230,53,0.55)",  soft: "rgba(163,230,53,0.12)"  }, // lime
  MBA236: { accent: "#818CF8", glow: "rgba(129,140,248,0.55)", soft: "rgba(129,140,248,0.12)" }, // indigo
  MBA238: { accent: "#22D3EE", glow: "rgba(34,211,238,0.55)",  soft: "rgba(34,211,238,0.12)"  }, // cyan
};


const FALLBACK: SubjectColor = {
  accent: "#93C5FD",
  glow: "rgba(147,197,253,0.5)",
  soft: "rgba(147,197,253,0.12)",
};

export function getSubjectColor(code: string): SubjectColor {
  return SUBJECT_COLORS[code] ?? FALLBACK;
}
