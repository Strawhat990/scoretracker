export interface Subject {
  code: string;
  short_name: string;
  full_name: string;
  sort_order: number;
}

export interface Marks {
  profile_id: string;
  subject_code: string;
  cia1: number | null;
  cia2: number | null;
  class_participation: number | null;
  mcq1?: number | null;
  mcq2?: number | null;
  mcq3?: number | null;
  mcq4?: number | null;
  mcq5?: number | null;
  cia3: number | null;
  end_sem: number | null;
  updated_at?: string;
}

export const EMPTY_MARKS: Omit<Marks, "profile_id" | "subject_code"> = {
  cia1: null,
  cia2: null,
  class_participation: null,
  mcq1: null,
  mcq2: null,
  mcq3: null,
  mcq4: null,
  mcq5: null,
  cia3: null,
  end_sem: null,
};
