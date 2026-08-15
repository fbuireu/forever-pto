import { logClient } from '@application/shared/utils/clientLog';
import { FilterStrategy } from '@domain/calendar/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { obfuscatedStorage } from './crypto';

export interface FiltersState {
  ptoDays: number;
  allowPastDays: boolean;
  country: string;
  region: string;
  year: number;
  carryOverMonths: number;
  strategy: FilterStrategy;
}

interface FilterActions {
  setPtoDays: (days: number) => void;
  setAllowPastDays: (allow: boolean) => void;
  setCountry: (country: string) => void;
  setRegion: (region: string) => void;
  setYear: (year: number) => void;
  setCarryOverMonths: (months: number) => void;
  setStrategy: (strategy: FilterStrategy) => void;
  resetToDefaults: () => void;
}

type FiltersStore = FiltersState & FilterActions;

const STORAGE_NAME = 'filters-store';
const STORAGE_VERSION = 2;

export const MIN_PTO_DAYS = 1;
export const MAX_PTO_DAYS = 365;
export const MIN_CARRY_OVER_MONTHS = 1;
export const MAX_CARRY_OVER_MONTHS = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const initialState: FiltersState = {
  ptoDays: 22,
  allowPastDays: false,
  country: '',
  region: '',
  year: new Date().getFullYear(),
  carryOverMonths: 1,
  strategy: FilterStrategy.GROUPED,
};

const partializeFilters = (state: FiltersStore) => ({
  ptoDays: state.ptoDays,
  allowPastDays: state.allowPastDays,
  country: state.country,
  region: state.region,
  carryOverMonths: state.carryOverMonths,
  strategy: state.strategy,
});

type PersistedFiltersState = ReturnType<typeof partializeFilters>;

export const useFiltersStore = create<FiltersStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setPtoDays: (days: number) =>
          set({ ptoDays: clamp(Math.round(days), MIN_PTO_DAYS, MAX_PTO_DAYS) }, false, 'setPtoDays'),
        setCountry: (country: string) => set({ country, region: '' }, false, 'setCountry'),
        setRegion: (region: string) => set({ region }, false, 'setRegion'),
        setAllowPastDays: (allow: boolean) => set({ allowPastDays: allow }, false, 'setAllowPastDays'),
        setYear: (year: number) => set({ year }, false, 'setYear'),
        setCarryOverMonths: (months: number) =>
          set(
            { carryOverMonths: clamp(Math.round(months), MIN_CARRY_OVER_MONTHS, MAX_CARRY_OVER_MONTHS) },
            false,
            'setCarryOverMonths'
          ),
        setStrategy: (strategy: FilterStrategy) => set({ strategy }, false, 'setStrategy'),
        resetToDefaults: () => set(initialState, false, 'resetToDefaults'),
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: obfuscatedStorage,
        partialize: partializeFilters,
        migrate: (persisted) => {
          const { year: _staleYear, ...rest } = (persisted ?? {}) as Partial<FiltersState>;
          return rest as PersistedFiltersState;
        },
        onRehydrateStorage: () => (state, error) => {
          if (state) {
            state.ptoDays = clamp(Math.round(state.ptoDays), MIN_PTO_DAYS, MAX_PTO_DAYS);
            state.carryOverMonths = clamp(
              Math.round(state.carryOverMonths),
              MIN_CARRY_OVER_MONTHS,
              MAX_CARRY_OVER_MONTHS
            );
          }

          if (error) {
            logClient((logger) =>
              logger.logError('Error rehydrating filters store', error, {
                storeName: STORAGE_NAME,
                hasState: !!state,
              })
            );
            globalThis.localStorage?.removeItem(STORAGE_NAME);
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
