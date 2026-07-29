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
  cia3: number | null;
  end_sem: number | null;
  updated_at?: string;
}

export const EMPTY_MARKS: Omit<Marks, "profile_id" | "subject_code"> = {
  cia1: null,
  cia2: null,
  class_participation: null,
  cia3: null,
  end_sem: null,
};
