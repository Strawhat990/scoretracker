import { Marks } from "@/types";

export const MAX = {
  cia1: 15,
  cia2: 25,
  class_participation: 15,
  cia3: 15,
  end_sem_raw: 30, // what the user enters (directly out of 30)
  end_sem_scaled: 30, // what it counts for
  internal_total: 70,
  grand_total: 100,
} as const;

export interface GradeBreakdown {
  internalTotal: number; // sum of the 4 internal components, out of 70
  endSemScaled: number; // end_sem input out of 30
  grandTotal: number; // internalTotal + endSemScaled, out of 100
  percentage: number; // grandTotal as a % (0-100)
  evaluatedMax: number; // sum of maximum possible marks for fields entered
}

/** Clamps an End Sem mark to [0, 30]. */
export function scaleEndSem(raw: number | null): number {
  if (raw == null || isNaN(raw)) return 0;
  return Math.max(0, Math.min(raw, MAX.end_sem_raw));
}

export function computeGrade(marks: Partial<Marks>): GradeBreakdown {
  const cia1 = marks.cia1 ?? 0;
  const cia2 = marks.cia2 ?? 0;
  const cp = marks.class_participation ?? 0;
  const cia3 = marks.cia3 ?? 0;

  let evaluatedMax = 0;
  if (marks.cia1 != null) evaluatedMax += MAX.cia1;
  if (marks.cia2 != null) evaluatedMax += MAX.cia2;
  if (marks.class_participation != null) {
    const hasMcqs = marks.mcq1 != null || marks.mcq2 != null || marks.mcq3 != null || marks.mcq4 != null || marks.mcq5 != null;
    if (hasMcqs) {
      let mcqCount = 0;
      if (marks.mcq1 != null) mcqCount++;
      if (marks.mcq2 != null) mcqCount++;
      if (marks.mcq3 != null) mcqCount++;
      if (marks.mcq4 != null) mcqCount++;
      if (marks.mcq5 != null) mcqCount++;
      evaluatedMax += (mcqCount / 5) * MAX.class_participation;
    } else {
      evaluatedMax += MAX.class_participation;
    }
  }
  if (marks.cia3 != null) evaluatedMax += MAX.cia3;
  if (marks.end_sem != null) evaluatedMax += MAX.end_sem_scaled;

  const internalTotal = cia1 + cia2 + cp + cia3;
  const endSemScaled = scaleEndSem(marks.end_sem ?? null);
  const grandTotal = internalTotal + endSemScaled;

  return {
    internalTotal,
    endSemScaled,
    grandTotal,
    percentage: (grandTotal / MAX.grand_total) * 100,
    evaluatedMax,
  };
}

/** Clamps a numeric input to [0, max], allowing null (empty field). */
export function clampInput(value: string, max: number): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(n, max));
}
