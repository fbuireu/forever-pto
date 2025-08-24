import type { HolidayDTO } from '@application/dto/holiday/types';
import { generateAlternatives } from '@infrastructure/services/calendar/alternatives/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import { FilterStrategy, Suggestion } from '@infrastructure/services/calendar/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/dates';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { FiltersState } from './filters';

export interface HolidaysState {
  holidays: HolidayDTO[];
  suggestion: Suggestion;
  maxAlternatives: number;
  alternatives: Suggestion[];
  currentSelection: Suggestion | null;
  previewAlternativeSelection: Suggestion | null;
  previewAlternativeIndex: number;
  currentSelectionIndex: number;
}

interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  allowPastDays: boolean;
    months: Date[];
    strategy: FilterStrategy;
}

interface GenerateAlternativesParams extends GenerateSuggestionsParams {
  maxAlternatives?: number;
}

interface FetchHolidaysParams extends Omit<FiltersState, 'ptoDays' | 'allowPastDays' | 'carryOverMonths' | 'strategy'> {
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => void;
  generateAlternatives: (params: GenerateAlternativesParams) => void;
  setMaxAlternatives: (max: number) => void;
  setCurrentAlternativeSelection: (selection: Suggestion | null, index: number) => void;
  setPreviewAlternativeSelection: (selection: Suggestion | null, index: number) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const STORE_NAME = 'holidays-store';

const initialState: HolidaysState = {
  holidays: [],
  suggestion: {} as Suggestion,
  maxAlternatives: 4,
  alternatives: [],
  currentSelection: null,
  previewAlternativeSelection: null,
  previewAlternativeIndex: 0,
  currentSelectionIndex: 0,
};

export const useHolidaysStore = create<HolidaysStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          try {
            const holidays = await getHolidays(params);
            const holidaysWithDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));
            set({
              holidays: holidaysWithDates,
            });
          } catch (error) {
            set({
              holidays: [],
            });
          }
        },

        generateSuggestions: ({ year, ptoDays, allowPastDays, months, strategy }: GenerateSuggestionsParams) => {
          const { holidays, maxAlternatives } = get();

          if (ptoDays <= 0 || holidays.length === 0) {
            set({
              suggestion: undefined,
              alternatives: [],
              currentSelection: null,
              previewAlternativeSelection: null,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
            return;
          }

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
              strategy,
            });

            const alternatives = generateAlternatives({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
              maxAlternatives,
              existingSuggestion: suggestion.days,
              strategy,
            });

            set({
              suggestion,
              alternatives,
              currentSelection: suggestion,
              previewAlternativeSelection: suggestion,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
          } catch (error) {
            console.error('Error generating suggestions:', error);
            set({
              suggestion: undefined,
              alternatives: [],
              currentSelection: null,
              previewAlternativeSelection: null,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
          }
        },

        generateAlternatives: ({
          year,
          ptoDays,
          allowPastDays,
          months,
            maxAlternatives,
          strategy,
        }: GenerateAlternativesParams) => {
          const { holidays, maxAlternatives: stateMaxAlternatives, suggestion } = get();
          const maxToGenerate = maxAlternatives ?? stateMaxAlternatives;

          if (ptoDays <= 0 || holidays.length === 0 || maxToGenerate <= 0 || !suggestion) {
            set({ alternatives: [] });
            return;
          }

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
              strategy,
            });

            set({
              alternatives,
            });
          } catch (error) {
            console.error('Error generating alternatives:', error);
            set({
              alternatives: [],
            });
          }
        },

        setMaxAlternatives: (max: number) => {
          set({ maxAlternatives: Math.max(0, max) });
        },

        setCurrentAlternativeSelection: (selection: Suggestion | null, index: number) => {
          set({
            currentSelection: selection,
            previewAlternativeSelection: selection,
            previewAlternativeIndex: index,
            currentSelectionIndex: index,
          });
        },

        setPreviewAlternativeSelection: (selection: Suggestion | null, index: number) => {
          set({
            previewAlternativeSelection: selection,
            previewAlternativeIndex: index,
          });
        },
      }),
      {
        name: STORE_NAME,
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestion: state.suggestion,
          maxAlternatives: state.maxAlternatives,
          alternatives: state.alternatives,
          currentSelection: state.currentSelection,
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
              state.previewAlternativeSelection = state.suggestion;
              state.previewAlternativeIndex = 0;
              state.currentSelectionIndex = 0;
            }

            if (state.alternatives) {
              state.alternatives = state.alternatives.map((alt) => ({
                ...alt,
                days: alt.days.map(ensureDate),
              }));
            }

            if (state.currentSelection) {
              state.currentSelection = {
                ...state.currentSelection,
                days: state.currentSelection.days.map(ensureDate),
              };
              state.previewAlternativeSelection = state.currentSelection;
            }
          }
        },
      }
    ),
    { name: STORE_NAME }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
