import { HolidayVariant, type HolidayDTO } from '@application/dto/holiday/types';
import { generateAlternatives } from '@infrastructure/services/calendar/alternatives/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/helpers';
import { formatDate } from '@ui/modules/components/utils/formatters';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';

import type {
  AddHolidayParams,
  AlternativeSelectionBaseParams,
  EditHolidayParams,
  FetchHolidaysParams,
  GenerateAlternativesParams,
  GenerateSuggestionsParams,
} from './types';

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

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => void;
  generateAlternatives: (params: GenerateAlternativesParams) => void;
  setMaxAlternatives: (max: number) => void;
  setCurrentAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  setPreviewAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  resetToDefaults: () => void;
  addHoliday: (params: AddHolidayParams) => void;
  editHoliday: (params: EditHolidayParams) => void;
  removeHoliday: (holidayId: string) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const STORAGE_NAME = 'holidays-store';
const STORAGE_VERSION = 1;

const holidaysInitialState: HolidaysState = {
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
        ...holidaysInitialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          try {
            const { holidays: currentHolidays } = get();
            const customHolidays = currentHolidays.filter((h) => h.variant === HolidayVariant.CUSTOM);
            const holidays = await getHolidays(params);
            const filteredHolidays = holidays.filter((fetchedHoliday) => {
              const hasCustomOnSameDate = customHolidays.some(
                (customHoliday) => customHoliday.date.toDateString() === fetchedHoliday.date.toDateString()
              );
              return !hasCustomOnSameDate;
            });
            set({
              holidays: [...customHolidays, ...filteredHolidays].sort((a, b) => a.date.getTime() - b.date.getTime()),
            });
          } catch (error) {
            console.warn('Error in fetchHolidays:', error);
            set({ holidays: [] });
          }
        },

        generateSuggestions: ({
          year,
          ptoDays,
          allowPastDays,
          months,
          strategy,
          locale,
        }: GenerateSuggestionsParams) => {
          const { holidays, maxAlternatives } = get();

          if (ptoDays <= 0 || holidays.length === 0) {
            set({
              suggestion: {} as Suggestion,
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
              locale,
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
              locale,
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
              suggestion: {} as Suggestion,
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
          locale,
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
              locale,
            });

            set({ alternatives });
          } catch (error) {
            console.error('Error generating alternatives:', error);
            set({ alternatives: [] });
          }
        },

        setMaxAlternatives: (max: number) => {
          set({ maxAlternatives: Math.max(0, max) });
        },

        setCurrentAlternativeSelection: ({ suggestion, index }: AlternativeSelectionBaseParams) => {
          set({
            currentSelection: suggestion,
            previewAlternativeSelection: suggestion,
            previewAlternativeIndex: index,
            currentSelectionIndex: index,
          });
        },

        setPreviewAlternativeSelection: ({ suggestion, index }: AlternativeSelectionBaseParams) => {
          set({
            previewAlternativeSelection: suggestion,
            previewAlternativeIndex: index,
          });
        },

        resetToDefaults: () => {
          set({ ...holidaysInitialState });
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

        editHoliday: ({ holidayId, locale, updates }: EditHolidayParams) => {
          const { holidays } = get();
          const holidayIndex = holidays.findIndex((h) => h.id === holidayId);

          if (holidayIndex === -1) return;

          const updatedHoliday = {
            ...holidays[holidayIndex],
            id: `custom-${formatDate({ date: updates.date, locale, format: 'yyyy-MM-dd HH:mm:ss' })}`,
            name: updates.name,
            variant: HolidayVariant.CUSTOM,
            date: ensureDate(updates.date),
          };

          const updatedHolidays = [
            ...holidays.slice(0, holidayIndex),
            updatedHoliday,
            ...holidays.slice(holidayIndex + 1),
          ];

          updatedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

          set({ holidays: updatedHolidays });
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays.map((h) => ({
            ...h,
            date: h.date.toISOString(),
          })),
          suggestion:
            state.suggestion && Object.keys(state.suggestion).length > 0
              ? {
                  ...state.suggestion,
                  days: state.suggestion.days.map((d) => d.toISOString()),
                }
              : state.suggestion,
          maxAlternatives: state.maxAlternatives,
          alternatives: state.alternatives.map((alt) => ({
            ...alt,
            days: alt.days.map((d) => d.toISOString()),
          })),
          currentSelection: state.currentSelection
            ? {
                ...state.currentSelection,
                days: state.currentSelection.days.map((d) => d.toISOString()),
              }
            : null,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: ensureDate(h.date),
              }));
            }

            if (state.suggestion?.days) {
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

            if (state.currentSelection) {
              state.currentSelection = {
                ...state.currentSelection,
                days: state.currentSelection.days.map(ensureDate),
              };
            }
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
