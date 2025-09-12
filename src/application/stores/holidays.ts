import { HolidayVariant, type HolidayDTO } from '@application/dto/holiday/types';
import { generateAlternatives } from '@infrastructure/services/calendar/alternatives/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import type { FilterStrategy, Suggestion } from '@infrastructure/services/calendar/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/dates';
import { formatDate } from '@ui/modules/components/utils/formatters';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import type { FiltersState } from './filters';

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

interface FetchHolidaysParams extends Pick<FiltersState, 'year' | 'country' | 'region'> {
  locale: Locale;
}

interface AddHolidayParams {
  holiday: Omit<HolidayDTO, 'id' | 'variant'>;
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => void;
  generateAlternatives: (params: GenerateAlternativesParams) => void;
  setMaxAlternatives: (max: number) => void;
  setCurrentAlternativeSelection: (selection: Suggestion | null, index: number) => void;
  setPreviewAlternativeSelection: (selection: Suggestion | null, index: number) => void;
  resetToDefaults: () => void;
  addHoliday: (params: AddHolidayParams) => void;
  removeHoliday: (holidayId: string) => void;
  editHoliday: (holidayId: string, updates: { name?: string; date?: Date }) => void;
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
            const { holidays: currentHolidays } = get();
            const customHolidays = currentHolidays.filter((h) => h.variant === HolidayVariant.CUSTOM);
            const holidays = await getHolidays(params);

            set({
              holidays: [...customHolidays, ...holidays].sort((a, b) => a.date.getTime() - b.date.getTime()),
            });
          } catch (error) {
            console.warn('Error in fetchHolidays:', error);
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

        resetToDefaults: () => {
          set({
            ...initialState,
          });
        },
        addHoliday: ({ holiday, locale }) => {
          const { holidays } = get();
          const existingHoliday = holidays.find((h) => h.date.toDateString() === holiday.date.toDateString());

          if (existingHoliday) {
            console.warn('Holiday already exists on this date');
            return;
          }

          const newHoliday: HolidayDTO = {
            id: `custom-${formatDate({ date: holiday.date, locale, format: 'yyyy-MM-dd HH:mm:ss' })}`,
            name: holiday.name,
            date: ensureDate(holiday.date),
            variant: HolidayVariant.CUSTOM,
          };

          set({
            holidays: [...holidays, newHoliday].sort((a, b) => a.date.getTime() - b.date.getTime()),
          });
        },
        removeHoliday: (holidayId: string) => {
          const { holidays } = get();

          set({
            holidays: holidays.filter((h) => h.id !== holidayId),
          });
        },
        editHoliday: (holidayId: string, updates: { name?: string; date?: Date }) => {
          const { holidays } = get();

          const updatedHolidays = holidays.map((h) => {
            if (h.id === holidayId) {
              return {
                ...h,
                ...(updates.name && { name: updates.name }),
                ...(updates.date && { date: ensureDate(updates.date) }),
              };
            }
            return h;
          });

          // Si se cambió la fecha, reordenar la lista
          if (updates.date) {
            updatedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());
          }

          set({
            holidays: updatedHolidays,
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
