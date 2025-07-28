import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface PtoState {
  ptoDays: number;
  allowPastDays: boolean;
  country: string;
  region: string;
  year: number;
  carryOverMonths: number;
}

interface PtoActions {
  setPtoDays: (days: number) => void;
  setAllowPastDays: (allow: boolean) => void;
  setCountry: (country: string) => void;
  setRegion: (region: string) => void;
  setYear: (year: number) => void;
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
  year: new Date().getFullYear(),
  carryOverMonths: 1,
};

export const usePtoStore = create<PtoStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setPtoDays: (days: number) => set({ ptoDays: days }, false, 'setPtoDays'),
        setCountry: (country: string) => set({ country }, false, 'setCountry'),
        setRegion: (region: string) => set({ region }, false, 'setRegion'),
        setAllowPastDays: (allow: boolean) => set({ allowPastDays: allow }, false, 'setAllowPastDays'),
        setYear: (year: number) => set({ year }, false, 'setYear'),
        setCarryOverMonths: (months: number) => set({ carryOverMonths: months }, false, 'setCarryOverMonths'),
        resetToDefaults: () => set(initialState, false, 'resetToDefaults'),
        updateStore: (config: Partial<PtoState>) => set((state) => ({ ...state, ...config }), false, 'updateConfig'),
      }),
      {
        name: 'pto-config-storage',
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

export const usePtoDays = () => usePtoStore((state) => state.ptoDays);

export const useAllowPastDays = () => usePtoStore((state) => state.allowPastDays);

export const useLocation = () =>
  usePtoStore((state) => ({
    country: state.country,
    region: state.region,
  }));

export const useSetPtoDays = () => usePtoStore((state) => state.setPtoDays);
export const useSetAllowPastDays = () => usePtoStore((state) => state.setAllowPastDays);
export const useSetCountry = () => usePtoStore((state) => state.setCountry);
export const useSetRegion = () => usePtoStore((state) => state.setRegion);
export const useSetYear = () => usePtoStore((state) => state.setYear);
export const useSetCarryOverMonths = () => usePtoStore((state) => state.setCarryOverMonths);
export const useResetToDefaults = () => usePtoStore((state) => state.resetToDefaults);
export const useUpdateStore = () => usePtoStore((state) => state.updateStore);
