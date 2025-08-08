import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';

export interface PtoState {
  ptoDays: number;
  allowPastDays: boolean;
  country: string;
  region: string;
  year: string;
  carryOverMonths: number;
}

interface PtoActions {
  setPtoDays: (days: number) => void;
  setAllowPastDays: (allow: boolean) => void;
  setCountry: (country: string) => void;
  setRegion: (region: string) => void;
  setYear: (year: string) => void;
  setCarryOverMonths: (months: number) => void;
  resetToDefaults: () => void;
  updateStore: (config: Partial<PtoState>) => void;
}

type PtoStore = PtoState & PtoActions;

const initialState: PtoState = {
  ptoDays: 22,
  allowPastDays: false,
  country: '',
  region: '',
  year: String(new Date().getFullYear()),
  carryOverMonths: 1,
};

export const usePtoStore = create<PtoStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setPtoDays: (days: number) => set({ ptoDays: days }, false, 'setPtoDays'),
        setCountry: (country: string) => set({ country, region: '' }, false, 'setCountry'),
        setRegion: (region: string) => set({ region }, false, 'setRegion'),
        setAllowPastDays: (allow: boolean) => set({ allowPastDays: allow }, false, 'setAllowPastDays'),
        setYear: (year: string) => set({ year }, false, 'setYear'),
        setCarryOverMonths: (months: number) => set({ carryOverMonths: months }, false, 'setCarryOverMonths'),
        resetToDefaults: () => set(initialState, false, 'resetToDefaults'),
        updateStore: (config: Partial<PtoState>) => set((state) => ({ ...state, ...config })),
      }),
      {
        name: 'pto-config-storage',
        storage: encryptedStorage,
        partialize: (state) => ({
          ptoDays: state.ptoDays,
          allowPastDays: state.allowPastDays,
          country: state.country,
          region: state.region,
          year: state.year,
          carryOverMonths: state.carryOverMonths,
        }),
      }
    ),
    { name: 'pto-store' }
  )
);

export const usePtoState = () => usePtoStore((state) => state);
