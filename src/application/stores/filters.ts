import { FilterStrategy } from '@infrastructure/services/calendar/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';

export interface FiltersState {
  ptoDays: number;
  allowPastDays: boolean;
  country: string;
  region: string;
  year: string;
  carryOverMonths: number;
  strategy: FilterStrategy;
}

interface FilterActions {
  setPtoDays: (days: number) => void;
  setAllowPastDays: (allow: boolean) => void;
  setCountry: (country: string) => void;
  setRegion: (region: string) => void;
  setYear: (year: string) => void;
  setCarryOverMonths: (months: number) => void;
  setStrategy: (strategy: FilterStrategy) => void;
  resetToDefaults: () => void;
}

type FiltersStore = FiltersState & FilterActions;

const STORAGE_NAME = 'filters-store';
const STORAGE_VERSION = 1;

const initialState: FiltersState = {
  ptoDays: 22,
  allowPastDays: false,
  country: '',
  region: '',
  year: String(new Date().getFullYear()),
  carryOverMonths: 1,
  strategy: FilterStrategy.GROUPED,
};

export const useFiltersStore = create<FiltersStore>()(
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
        setStrategy: (strategy: FilterStrategy) => set({ strategy }, false, 'setStrategy'),
        resetToDefaults: () => set(initialState, false, 'resetToDefaults'),
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: encryptedStorage,
      }
    ),
    { name: STORAGE_NAME }
  )
);
