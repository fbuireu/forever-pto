import { HolidayVariant, type HolidayDTO } from '@application/dto/holiday/types';
import { isInSelectedRange } from '@application/dto/holiday/utils/helpers';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { generateAlternatives } from '@infrastructure/services/calendar/alternatives/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/helpers';
import { formatDate } from '@ui/modules/components/utils/formatters';
import { addMonths, endOfYear, startOfYear } from 'date-fns';
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

const logger = getBetterStackInstance();

export interface HolidaysState {
  holidays: HolidayDTO[];
  suggestion: Suggestion | null;
  maxAlternatives: number;
  alternatives: Suggestion[];
  currentSelection: Suggestion | null;
  previewAlternativeSelection: Suggestion | null;
  previewAlternativeIndex: number;
  currentSelectionIndex: number;
  manuallySelectedDays: Date[];
  removedSuggestedDays: Date[];
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
  toggleDaySelection: (date: Date, totalPtoDays: number) => boolean;
  resetManualSelection: () => void;
  getRemainingDays: (totalPtoDays: number) => number;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const STORAGE_NAME = 'holidays-store';
const STORAGE_VERSION = 1;

const holidaysInitialState: HolidaysState = {
  holidays: [],
  suggestion: null,
  maxAlternatives: 4,
  alternatives: [],
  currentSelection: null,
  previewAlternativeSelection: null,
  previewAlternativeIndex: 0,
  currentSelectionIndex: 0,
  manuallySelectedDays: [],
  removedSuggestedDays: [],
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
            logger.logError('Error fetching holidays in holidays store', error, {
              year: params.year,
              country: params.country,
              region: params.region,
            });
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
              suggestion: null,
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
            logger.logError('Error generating suggestions in holidays store', error, {
              year,
              ptoDays,
              holidaysCount: holidays.length,
              allowPastDays,
              strategy,
              locale,
            });
            set({
              suggestion: null,
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
            logger.logError('Error generating alternatives in holidays store', error, {
              year,
              ptoDays,
              holidaysCount: holidays.length,
              maxAlternatives: maxToGenerate,
              allowPastDays,
              strategy,
              locale,
            });
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
            manuallySelectedDays: [],
            removedSuggestedDays: [],
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

        addHoliday: ({ holiday, locale, year, carryOverMonths }) => {
          const { holidays } = get();
          const existingHoliday = holidays.find((h) => h.date.toDateString() === holiday.date.toDateString());

          if (existingHoliday) {
            logger.warn('Holiday already exists on this date', { date: holiday.date.toISOString() });
            return;
          }
          const yearStart = startOfYear(new Date(Number(year), 0, 1));
          const selectedRangeEnd = addMonths(endOfYear(new Date(Number(year), 0, 1)), carryOverMonths);

          const newHoliday: HolidayDTO = {
            id: `custom-${formatDate({ date: holiday.date, locale, format: 'yyyy-MM-dd HH:mm:ss' })}`,
            name: holiday.name,
            date: ensureDate(holiday.date),
            variant: HolidayVariant.CUSTOM,
            isInSelectedRange: isInSelectedRange({
              date: holiday.date,
              rangeStart: yearStart,
              rangeEnd: selectedRangeEnd,
            }),
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

        toggleDaySelection: (date: Date, totalPtoDays: number): boolean => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays } = get();
          const dateStr = date.toDateString();

          const isSuggested = currentSelection?.days.some((d) => d.toDateString() === dateStr);
          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === dateStr);
          const wasRemoved = removedSuggestedDays.some((d) => d.toDateString() === dateStr);

          if (isManuallySelected) {
            const updatedManualDays = manuallySelectedDays.filter((d) => d.toDateString() !== dateStr);
            set({
              manuallySelectedDays: updatedManualDays,
            });
            return true;
          }

          if (isSuggested && wasRemoved) {
            const updatedRemovedDays = removedSuggestedDays.filter((d) => d.toDateString() !== dateStr);
            set({
              removedSuggestedDays: updatedRemovedDays,
            });
            return true;
          }

          if (isSuggested && !wasRemoved) {
            const updatedRemovedDays = [...removedSuggestedDays, ensureDate(date)].sort(
              (a, b) => a.getTime() - b.getTime()
            );
            set({
              removedSuggestedDays: updatedRemovedDays,
            });
            return true;
          }
          const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
          const manualSelectedCount = manuallySelectedDays.length;
          const remaining = totalPtoDays - activeSuggestedCount - manualSelectedCount;

          if (remaining <= 0) {
            logger.warn('No remaining PTO days to assign', {
              totalPtoDays,
              activeSuggestedCount,
              manualSelectedCount,
            });
            return false;
          }

          const updatedManualDays = [...manuallySelectedDays, ensureDate(date)].sort(
            (a, b) => a.getTime() - b.getTime()
          );
          set({
            manuallySelectedDays: updatedManualDays,
          });
          return true;
        },

        resetManualSelection: () => {
          set({
            manuallySelectedDays: [],
            removedSuggestedDays: [],
          });
        },

        getRemainingDays: (totalPtoDays: number): number => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays } = get();
          const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
          const manualSelectedCount = manuallySelectedDays.length;
          return Math.max(0, totalPtoDays - activeSuggestedCount - manualSelectedCount);
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
          suggestion: state.suggestion
            ? {
                ...state.suggestion,
                days: state.suggestion.days.map((d) => d.toISOString()),
              }
            : null,
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
          manuallySelectedDays: state.manuallySelectedDays.map((d) => d.toISOString()),
          removedSuggestedDays: state.removedSuggestedDays.map((d) => d.toISOString()),
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            logger.logError('Error rehydrating holidays store', error, {
              storeName: STORAGE_NAME,
              hasState: !!state,
            });
            localStorage.removeItem(STORAGE_NAME);
            return;
          }

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

            if (state.manuallySelectedDays) {
              state.manuallySelectedDays = state.manuallySelectedDays.map(ensureDate);
            }

            if (state.removedSuggestedDays) {
              state.removedSuggestedDays = state.removedSuggestedDays.map(ensureDate);
            }
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
