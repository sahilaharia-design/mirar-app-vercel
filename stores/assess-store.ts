import { create } from 'zustand';

interface AssessState {
  q1: string[];    // What brought you here (multi-select)
  q2: string[];    // Which dimensions feel off (multi-select, max 3)
  q3: string;      // Check-in frequency (single)
  q4: string;      // When did you last feel fully yourself (free text)

  setQ1: (values: string[]) => void;
  setQ2: (values: string[]) => void;
  setQ3: (value: string) => void;
  setQ4: (value: string) => void;
  reset: () => void;
}

export const useAssessStore = create<AssessState>((set) => ({
  q1: [],
  q2: [],
  q3: '',
  q4: '',

  setQ1: (q1) => set({ q1 }),
  setQ2: (q2) => set({ q2 }),
  setQ3: (q3) => set({ q3 }),
  setQ4: (q4) => set({ q4 }),
  reset: () => set({ q1: [], q2: [], q3: '', q4: '' }),
}));
