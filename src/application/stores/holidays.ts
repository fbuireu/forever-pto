import type { HolidayDTO } from '@application/dto/holiday/types';
import { generateAlternatives } from '@infrastructure/services/calendar/suggestions/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import { Suggestion } from '@infrastructure/services/calendar/suggestions/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/dates';
import { getMonth, isSameDay } from 'date-fns';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { PtoState } from './pto';

export interface HolidaysState {
  holidays: HolidayDTO[];
  holidaysLoading: boolean;
  suggestion: Suggestion | null;
  suggestionsLoading: boolean;
  maxAlternatives: number;
  alternatives: Suggestion[];
  alternativesLoading: boolean;
}

interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  allowPastDays: boolean;
  months: Date[];
}

interface GenerateAlternativesParams extends GenerateSuggestionsParams {
  maxAlternatives?: number;
}

interface FetchHolidaysParams extends Omit<PtoState, 'ptoDays' | 'allowPastDays' | 'carryOverMonths'> {
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => void;
  generateAlternatives: (params: GenerateAlternativesParams) => void;
  getHolidaysByMonth: (month: number) => HolidayDTO[];
  clearSuggestions: () => void;
  clearAlternatives: () => void;
  isDateSuggested: (date: Date) => boolean;
  isDateInAlternative: (date: Date, alternativeIndex: number) => boolean;
  setMaxAlternatives: (max: number) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  suggestion: null,
  suggestionsLoading: false,
  maxAlternatives: 3,
  alternatives: [],
  alternativesLoading: false,
};

export const useHolidaysStore = create<HolidaysStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          set({ holidaysLoading: true });
          try {
            const holidays = await getHolidays(params);
            const holidaysWithDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));
            set({
              holidays: holidaysWithDates,
              holidaysLoading: false,
            });
          } catch (error) {
            set({
              holidaysLoading: false,
              holidays: [],
            });
          }
        },

        generateSuggestions: ({ year, ptoDays, allowPastDays, months }: GenerateSuggestionsParams) => {
          const { holidays, maxAlternatives } = get();

          if (ptoDays <= 0 || holidays.length === 0) {
            set({ suggestion: null });
            return;
          }

          set({ suggestionsLoading: true });

          try {
            const holidaysDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));

            const suggestion = generateSuggestions({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
            });

          const alternatives = generateAlternatives({
            year,
            ptoDays,
            holidays: holidaysDates,
            allowPastDays,
            months,
            maxAlternatives: maxAlternatives,
            existingSuggestion: suggestion.days,
          });

            set({
              suggestion,
              alternatives,
              alternativesLoading: false,
              suggestionsLoading: false,
            });
          } catch (error) {
            console.error('Error generating suggestions:', error);
            set({
              suggestion: null,
              suggestionsLoading: false,
            });
          }
        },

        generateAlternatives: ({
          year,
          ptoDays,
          allowPastDays,
          months,
          maxAlternatives,
        }: GenerateAlternativesParams) => {
          const { holidays, maxAlternatives: stateMaxAlternatives, suggestion } = get();
          const maxToGenerate = maxAlternatives ?? stateMaxAlternatives;

          if (ptoDays <= 0 || holidays.length === 0 || maxToGenerate <= 0 || !suggestion) {
            set({ alternatives: [] });
            return;
          }

          set({ alternativesLoading: true });

          try {
            const holidaysDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));

            const alternatives = generateAlternatives({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
              maxAlternatives: maxToGenerate,
              existingSuggestion: suggestion.days,
            });
            console.log({ alternatives });
            set({
              alternatives,
              alternativesLoading: false,
            });
          } catch (error) {
            console.error('Error generating alternatives:', error);
            set({
              alternatives: [],
              alternativesLoading: false,
            });
          }
        },

        getHolidaysByMonth: (month: number) => {
          const { holidays } = get();
          return holidays.filter((holiday) => {
            const holidayDate = ensureDate(holiday.date);
            return getMonth(holidayDate) + 1 === month;
          });
        },

        clearSuggestions: () => {
          set({ suggestion: null });
        },

        clearAlternatives: () => {
          set({ alternatives: [] });
        },

        isDateSuggested: (date: Date) => {
          const { suggestion } = get();
          if (!suggestion) return false;
          return suggestion.days.some((d) => isSameDay(d, date));
        },

        isDateInAlternative: (date: Date, alternativeIndex: number) => {
          const { alternatives } = get();
          const alternative = alternatives[alternativeIndex];
          if (!alternative) return false;
          return alternative.days.some((d) => isSameDay(d, date));
        },

        setMaxAlternatives: (max: number) => {
          set({ maxAlternatives: Math.max(0, max) });
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestion: state.suggestion,
          maxAlternatives: state.maxAlternatives,
          alternatives: state.alternatives,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: ensureDate(h.date),
              }));
            }

            if (state.suggestion) {
              state.suggestion = {
                ...state.suggestion,
                days: state.suggestion.days.map(ensureDate),
              };
            }

            if (state.alternatives) {
              state.alternatives = state.alternatives.map((alt) => ({
                ...alt,
                days: alt.days.map(ensureDate),
              }));
            }
          }
        },
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
