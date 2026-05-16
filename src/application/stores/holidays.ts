import { holidayDTO } from '@application/dto/holiday/dto';
import { HolidayVariant, type HolidayDTO } from '@application/dto/holiday/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { generateMetrics } from '@infrastructure/services/calendar/metrics/generateMetrics';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { ensureDate, isSameMonth } from '@ui/utils/dates';
import { useLocationStore } from './location';
import type { Locale } from 'next-intl';
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
  isCalculating: boolean;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => Promise<void>;
  generateAlternatives: (params: GenerateAlternativesParams) => Promise<void>;
  setCalculating: (v: boolean) => void;
  setCalculationResult: (result: { suggestion: Suggestion; alternatives: Suggestion[] }) => void;
  setMaxAlternatives: (max: number) => void;
  setCurrentAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  setPreviewAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  resetToDefaults: () => void;
  addHoliday: (params: AddHolidayParams) => void;
  editHoliday: (params: EditHolidayParams) => void;
  removeHoliday: (holidayId: string) => void;
  toggleDaySelection: (params: { date: Date; totalPtoDays: number; locale: Locale; allowPastDays: boolean }) => boolean;
  resetManualSelection: () => void;
  trimManualDays: (maxPtoDays: number) => void;
  getRemainingDays: (totalPtoDays: number) => number;
  getFreeDaysForMonth: (month: Date) => number;
}

type HolidaysStore = HolidaysState & HolidaysActions;

function withMetrics(
  alternatives: Suggestion[],
  opts: { locale: string; holidays: HolidayDTO[]; allowPastDays: boolean }
) {
  return alternatives.map((alt) => ({
    ...alt,
    metrics: generateMetrics({ suggestion: alt, locale: opts.locale, bridges: alt.bridges, holidays: opts.holidays, allowPastDays: opts.allowPastDays }),
  }));
}

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
  isCalculating: false,
};

export const useHolidaysStore = create<HolidaysStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...holidaysInitialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          try {
            const { regions } = useLocationStore.getState();
            const { holidays: currentHolidays } = get();
            const customHolidays = currentHolidays.filter((h) => h.variant === HolidayVariant.CUSTOM);
            const { getHolidays } = await import('@infrastructure/services/holidays/getHolidays');
            const holidays = await getHolidays({ ...params, regions });
            const filteredHolidays = holidays.filter((fetchedHoliday) => {
              const hasCustomOnSameDate = customHolidays.some(
                (customHoliday) => customHoliday.date.toDateString() === fetchedHoliday.date.toDateString()
              );
              return !hasCustomOnSameDate;
            });
            set({
              holidays: [...customHolidays, ...filteredHolidays].toSorted(
                (a, b) => a.date.getTime() - b.date.getTime()
              ),
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

        generateSuggestions: async ({
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
            const [{ generateSuggestions }, { generateAlternatives }] = await Promise.all([
              import('@infrastructure/services/calendar/suggestions/generateSuggestions'),
              import('@infrastructure/services/calendar/alternatives/generateAlternatives'),
            ]);

            const holidaysDates = holidayDTO.normalize(holidays);
            const metricsOpts = { locale, holidays: holidaysDates, allowPastDays };

            const baseSuggestion = generateSuggestions({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
              strategy,
            });

            const baseAlternatives = generateAlternatives({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
              maxAlternatives,
              existingSuggestion: baseSuggestion.days,
              strategy,
            });

            const suggestion = {
              ...baseSuggestion,
              metrics: generateMetrics({ suggestion: baseSuggestion, locale, bridges: baseSuggestion.bridges, holidays: holidaysDates, allowPastDays }),
            };

            const alternatives = withMetrics(baseAlternatives, metricsOpts);

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

        generateAlternatives: async ({
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
            const [{ generateAlternatives }] = await Promise.all([
              import('@infrastructure/services/calendar/alternatives/generateAlternatives'),
            ]);

            const holidaysDates = holidayDTO.normalize(holidays);

            const baseAlternatives = generateAlternatives({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
              maxAlternatives: maxToGenerate,
              existingSuggestion: suggestion.days,
              strategy,
            });

            const alternatives = withMetrics(baseAlternatives, { locale, holidays: holidaysDates, allowPastDays });

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

        setCalculating: (v: boolean) => {
          set({ isCalculating: v });
        },

        setCalculationResult: ({
          suggestion,
          alternatives,
        }: {
          suggestion: Suggestion;
          alternatives: Suggestion[];
        }) => {
          const { currentSelectionIndex } = get();
          const allSuggestions = [suggestion, ...alternatives];
          const preservedIndex = currentSelectionIndex < allSuggestions.length ? currentSelectionIndex : 0;
          const preservedSelection = allSuggestions[preservedIndex] ?? suggestion;

          set({
            suggestion,
            alternatives,
            currentSelection: preservedSelection,
            previewAlternativeSelection: preservedSelection,
            previewAlternativeIndex: preservedIndex,
            currentSelectionIndex: preservedIndex,
            removedSuggestedDays: [],
          });
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

          const newHoliday = holidayDTO.createCustom({
            name: holiday.name,
            date: holiday.date,
            locale,
            year,
            carryOverMonths,
          });

          set({
            holidays: [...holidays, newHoliday].toSorted((a, b) => a.date.getTime() - b.date.getTime()),
          });
        },

        removeHoliday: (holidayId: string) => {
          const { holidays } = get();
          set({
            holidays: holidays.filter((h) => h.id !== holidayId),
          });
        },

        editHoliday: ({ holidayId, locale, updates, year, carryOverMonths }: EditHolidayParams) => {
          const { holidays } = get();
          const holidayIndex = holidays.findIndex((h) => h.id === holidayId);

          if (holidayIndex === -1) return;

          const updatedHoliday = holidayDTO.createCustom({
            name: updates.name,
            date: updates.date,
            locale,
            year,
            carryOverMonths,
          });

          const updatedHolidays = [
            ...holidays.slice(0, holidayIndex),
            updatedHoliday,
            ...holidays.slice(holidayIndex + 1),
          ].toSorted((a, b) => a.date.getTime() - b.date.getTime());

          set({ holidays: updatedHolidays });
        },

        toggleDaySelection: ({ date, totalPtoDays, locale, allowPastDays }): boolean => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays, holidays } = get();
          const dateStr = date.toDateString();

          if (!currentSelection) return false;

          const isSuggested = currentSelection.days.some((d) => d.toDateString() === dateStr);
          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === dateStr);
          const wasRemoved = removedSuggestedDays.some((d) => d.toDateString() === dateStr);

          let updatedManualDays = manuallySelectedDays;
          let updatedRemovedDays = removedSuggestedDays;

          if (isManuallySelected) {
            updatedManualDays = manuallySelectedDays.filter((d) => d.toDateString() !== dateStr);
          } else if (isSuggested && wasRemoved) {
            updatedRemovedDays = removedSuggestedDays.filter((d) => d.toDateString() !== dateStr);
          } else if (isSuggested && !wasRemoved) {
            updatedRemovedDays = [...removedSuggestedDays, ensureDate(date)].toSorted(
              (a, b) => a.getTime() - b.getTime()
            );
          } else {
            const activeSuggestedCount = currentSelection.days.length - removedSuggestedDays.length;
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

            updatedManualDays = [...manuallySelectedDays, ensureDate(date)].toSorted(
              (a, b) => a.getTime() - b.getTime()
            );
          }

          const updatedMetrics = generateMetrics({
            suggestion: currentSelection,
            locale,
            bridges: currentSelection.bridges,
            holidays,
            allowPastDays,
            manuallySelectedDays: updatedManualDays,
            removedSuggestedDays: updatedRemovedDays,
            totalPtoBudget: totalPtoDays,
          });

          set({
            manuallySelectedDays: updatedManualDays,
            removedSuggestedDays: updatedRemovedDays,
            currentSelection: { ...currentSelection, metrics: updatedMetrics },
          });
          return true;
        },

        resetManualSelection: () => {
          const { currentSelection, currentSelectionIndex, suggestion, alternatives } = get();

          if (!currentSelection) {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
            });
            return;
          }

          const baseSelection = currentSelectionIndex === 0 ? suggestion : alternatives[currentSelectionIndex - 1];

          if (baseSelection) {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
              currentSelection: baseSelection,
            });
          } else {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
            });
          }
        },

        trimManualDays: (maxPtoDays: number): void => {
          const { manuallySelectedDays } = get();
          if (manuallySelectedDays.length > maxPtoDays) {
            set({ manuallySelectedDays: manuallySelectedDays.slice(0, maxPtoDays) });
          }
        },

        getRemainingDays: (totalPtoDays: number): number => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays } = get();
          const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
          const manualSelectedCount = manuallySelectedDays.length;
          return Math.max(0, totalPtoDays - activeSuggestedCount - manualSelectedCount);
        },

        getFreeDaysForMonth: (month: Date): number => {
          const { holidays } = get();
          return holidays.filter((h) => isSameMonth(h.date, month) && h.isInSelectedRange).length;
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
                bridges: state.suggestion.bridges?.map((b) => ({
                  ...b,
                  startDate: b.startDate.toISOString(),
                  endDate: b.endDate.toISOString(),
                  ptoDays: b.ptoDays.map((d) => d.toISOString()),
                })),
              }
            : null,
          maxAlternatives: state.maxAlternatives,
          alternatives: state.alternatives.map((alt) => ({
            ...alt,
            days: alt.days.map((d) => d.toISOString()),
            bridges: alt.bridges?.map((b) => ({
              ...b,
              startDate: b.startDate.toISOString(),
              endDate: b.endDate.toISOString(),
              ptoDays: b.ptoDays.map((d) => d.toISOString()),
            })),
          })),
          currentSelection: state.currentSelection
            ? {
                ...state.currentSelection,
                days: state.currentSelection.days.map((d) => d.toISOString()),
                bridges: state.currentSelection.bridges?.map((b) => ({
                  ...b,
                  startDate: b.startDate.toISOString(),
                  endDate: b.endDate.toISOString(),
                  ptoDays: b.ptoDays.map((d) => d.toISOString()),
                })),
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
            const reviveSuggestion = (s: Suggestion | null): Suggestion | null => {
              if (!s) return null;
              return {
                ...s,
                days: s.days.map(ensureDate),
                bridges: s.bridges?.map((b) => ({
                  ...b,
                  startDate: ensureDate(b.startDate),
                  endDate: ensureDate(b.endDate),
                  ptoDays: b.ptoDays.map(ensureDate),
                })),
              };
            };

            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: ensureDate(h.date),
              }));
            }

            if (state.suggestion) {
              state.suggestion = reviveSuggestion(state.suggestion);
            }

            if (state.alternatives) {
              state.alternatives = state.alternatives.map((alt) => reviveSuggestion(alt) as Suggestion);
            }

            if (state.currentSelection) {
              state.currentSelection = reviveSuggestion(state.currentSelection);
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
