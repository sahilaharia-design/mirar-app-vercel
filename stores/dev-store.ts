import { create } from 'zustand';

interface DevStoreState {
  simulatedDay: number | null;
  setSimulatedDay: (day: number | null) => void;
  resetSimulatedDay: () => void;
}

export const useDevStore = create<DevStoreState>((set) => ({
  simulatedDay: null,
  setSimulatedDay: (day) => set({ simulatedDay: day }),
  resetSimulatedDay: () => set({ simulatedDay: null }),
}));
