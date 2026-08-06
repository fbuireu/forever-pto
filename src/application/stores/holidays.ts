import { holidayDTO, isInPlanningWindow } from '@application/dto/holiday/dto';
import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import {
  addMonths,
  endOfMonth,
  endOfYear,
  ensureDate,
  isSameMonth,
  isWeekend,
  isWithinInterval,
} from '@application/shared/utils/dates';
import { generateMetrics } from '@domain/calendar/metrics/generateMetrics';
import { MONTHS_IN_YEAR } from '@domain/calendar/metrics/utils/helpers';
import type { Suggestion } from '@domain/calendar/types';
import type { BetterStackClient } from '@infrastructure/clients/logging/better-stack/client';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { obfuscatedStorage } from './crypto';
import { useFiltersStore } from './filters';
import { useLocationStore } from './location';
import type {
  AddHolidayParams,
  AlternativeSelectionBaseParams,
  EditHolidayParams,
  FetchHolidaysParams,
  MainThreadSuggestionsParams,
  PlanningWindowParams,
} from './types';

const log = (write: (logger: BetterStackClient) => void) => {
  void import('@infrastructure/clients/logging/better-stack/client').then(({ getBetterStackInstance }) => {
    write(getBetterStackInstance());
  });
};

export interface HolidaysState {
  holidays: HolidayDTO[];
  suggestion: Suggestion | null;
  maxAlternatives: number;
  alternatives: Suggestion[];
  currentSelection: Suggestion | null;
  previewAlternativeIndex: number;
  currentSelectionIndex: number;
  manuallySelectedDays: Date[];
  removedSuggestedDays: Date[];
  isCalculating: boolean;
  hasCalculated: boolean;
  planRevision: number;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: MainThreadSuggestionsParams) => Promise<void>;
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
  pruneDaysOutsideWindow: (params?: PlanningWindowParams) => void;
  clearCalculation: () => void;
  resetManualSelection: () => void;
  trimManualDays: (maxPtoDays: number) => void;
  getRemainingDays: (totalPtoDays: number) => number;
  getFreeDaysForMonth: (month: Date) => number;
}

type HolidaysStore = HolidaysState & HolidaysActions;

function withMetrics(
  alternatives: Suggestion[],
  opts: {
    locale: string;
    year: number;
    holidays: HolidayDTO[];
    allowPastDays: boolean;
    manuallySelectedDays: Date[];
    removedSuggestedDays: Date[];
    carryOverMonths: number;
  }
) {
  return alternatives.map((alt) => ({
    ...alt,
    metrics: generateMetrics({
      suggestion: alt,
      locale: opts.locale,
      year: opts.year,
      bridges: alt.bridges,
      holidays: opts.holidays,
      allowPastDays: opts.allowPastDays,
      manuallySelectedDays: opts.manuallySelectedDays,
      removedSuggestedDays: opts.removedSuggestedDays,
      carryOverMonths: opts.carryOverMonths,
    }),
  }));
}

const STORAGE_NAME = 'holidays-store';
const STORAGE_VERSION = 1;

const getPlanningWindow = ({ year, carryOverMonths }: PlanningWindowParams) => {
  const start = new Date(year, 0, 1);
  return { start, end: endOfMonth(addMonths(endOfYear(start), carryOverMonths)) };
};

const holidaysInitialState: HolidaysState = {
  holidays: [],
  suggestion: null,
  maxAlternatives: 4,
  alternatives: [],
  currentSelection: null,
  previewAlternativeIndex: 0,
  currentSelectionIndex: 0,
  manuallySelectedDays: [],
  removedSuggestedDays: [],
  isCalculating: false,
  hasCalculated: false,
  planRevision: 0,
};

const serializeSuggestion = (suggestion: Suggestion) => ({
  ...suggestion,
  days: suggestion.days.map((d) => d.toISOString()),
  bridges: suggestion.bridges?.map((b) => ({
    ...b,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    ptoDays: b.ptoDays.map((d) => d.toISOString()),
  })),
});

const partializeHolidays = (state: HolidaysStore) => ({
  holidays: state.holidays.map((h) => ({
    ...h,
    date: h.date.toISOString(),
  })),
  suggestion: state.suggestion ? serializeSuggestion(state.suggestion) : null,
  maxAlternatives: state.maxAlternatives,
  alternatives: state.alternatives.map(serializeSuggestion),
  currentSelection: state.currentSelection ? serializeSuggestion(state.currentSelection) : null,
  currentSelectionIndex: state.currentSelectionIndex,
  manuallySelectedDays: state.manuallySelectedDays.map((d) => d.toISOString()),
  removedSuggestedDays: state.removedSuggestedDays.map((d) => d.toISOString()),
});

export const useHolidaysStore = create<HolidaysStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...holidaysInitialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          const { holidays: currentHolidays } = get();
          const customHolidays = currentHolidays
            .filter((h) => h.variant === HolidayVariant.CUSTOM)
            .map((h) => ({
              ...h,
              isInSelectedRange: isInPlanningWindow({
                date: ensureDate(h.date),
                year: params.year,
                carryOverMonths: params.carryOverMonths,
              }),
            }));

          try {
            const { regions } = useLocationStore.getState();
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
            log((logger) =>
              logger.logError('Error fetching holidays in holidays store', error, {
                year: params.year,
                country: params.country,
                region: params.region,
              })
            );
            set({ holidays: customHolidays });
          }
        },

        generateSuggestions: async ({
          year,
          ptoDays,
          allowPastDays,
          months,
          strategy,
          locale,
          autoSuggestCount,
        }: MainThreadSuggestionsParams) => {
          const { holidays, maxAlternatives, manuallySelectedDays, removedSuggestedDays } = get();

          const manualPseudoHolidays = manuallySelectedDays.map((date, i) => ({
            id: `manual-${i}`,
            date,
            name: 'Manual day',
            variant: HolidayVariant.CUSTOM,
            isInSelectedRange: true,
          }));
          const carryOverMonths = Math.max(0, months.length - MONTHS_IN_YEAR);
          const holidaysWithManual = [...holidays, ...manualPseudoHolidays];
          const effectivePtoDays = Math.max(0, autoSuggestCount ?? ptoDays - manuallySelectedDays.length);

          if (effectivePtoDays <= 0 || holidaysWithManual.length === 0) {
            set({
              suggestion: null,
              alternatives: [],
              currentSelection: null,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
            return;
          }

          try {
            const [{ generateSuggestions }, { generateAlternatives }, { clearDateKeyCache, clearHolidayCache }] =
              await Promise.all([
                import('@domain/calendar/suggestions/generateSuggestions'),
                import('@domain/calendar/alternatives/generateAlternatives'),
                import('@domain/calendar/utils/cache'),
              ]);

            clearDateKeyCache();
            clearHolidayCache();

            const normalizedHolidays = holidayDTO.normalize(holidaysWithManual);
            const metricsOpts = {
              locale,
              year,
              holidays: normalizedHolidays,
              allowPastDays,
              manuallySelectedDays,
              removedSuggestedDays,
              carryOverMonths,
            };

            const baseSuggestion = generateSuggestions({
              ptoDays: effectivePtoDays,
              holidays: normalizedHolidays,
              allowPastDays,
              months,
              strategy,
              removedDays: removedSuggestedDays,
            });

            const baseAlternatives = generateAlternatives({
              ptoDays: effectivePtoDays,
              holidays: normalizedHolidays,
              allowPastDays,
              months,
              maxAlternatives,
              existingSuggestion: baseSuggestion.days,
              strategy,
              removedDays: removedSuggestedDays,
            });

            const suggestion = {
              ...baseSuggestion,
              metrics: generateMetrics({
                suggestion: baseSuggestion,
                locale,
                year,
                bridges: baseSuggestion.bridges,
                holidays: normalizedHolidays,
                allowPastDays,
                manuallySelectedDays,
                removedSuggestedDays,
                carryOverMonths,
              }),
            };

            const alternatives = withMetrics(baseAlternatives, metricsOpts);

            set({
              suggestion,
              alternatives,
              currentSelection: suggestion,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
          } catch (error) {
            log((logger) =>
              logger.logError('Error generating suggestions in holidays store', error, {
                year,
                ptoDays,
                holidaysCount: holidays.length,
                allowPastDays,
                strategy,
                locale,
              })
            );
            set({
              suggestion: null,
              alternatives: [],
              currentSelection: null,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
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
            previewAlternativeIndex: preservedIndex,
            currentSelectionIndex: preservedIndex,
            removedSuggestedDays: [],
            hasCalculated: true,
          });
        },

        setMaxAlternatives: (max: number) => {
          set({ maxAlternatives: Math.max(0, max) });
        },

        setCurrentAlternativeSelection: ({ suggestion, index }: AlternativeSelectionBaseParams) => {
          const { planRevision } = get();

          set({
            currentSelection: suggestion,
            previewAlternativeIndex: index,
            currentSelectionIndex: index,
            removedSuggestedDays: [],
            planRevision: planRevision + 1,
          });
        },

        setPreviewAlternativeSelection: ({ index }: AlternativeSelectionBaseParams) => {
          set({ previewAlternativeIndex: index });
        },

        resetToDefaults: () => {
          set({ ...holidaysInitialState });
        },

        addHoliday: ({ holiday, locale, year, carryOverMonths }) => {
          const { holidays, manuallySelectedDays } = get();
          const existingHoliday = holidays.find((h) => h.date.toDateString() === holiday.date.toDateString());

          if (existingHoliday) {
            log((logger) => logger.warn('Holiday already exists on this date', { date: holiday.date.toISOString() }));
            return;
          }

          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === holiday.date.toDateString());

          if (isManuallySelected) {
            log((logger) =>
              logger.warn('A PTO day is already booked on this date', { date: holiday.date.toISOString() })
            );
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
          const { holidays, manuallySelectedDays } = get();
          const holidayIndex = holidays.findIndex((h) => h.id === holidayId);

          if (holidayIndex === -1) return;

          const targetDateStr = ensureDate(updates.date).toDateString();
          const collidesWithHoliday = holidays.some(
            (h, index) => index !== holidayIndex && ensureDate(h.date).toDateString() === targetDateStr
          );
          const collidesWithManualDay = manuallySelectedDays.some((d) => d.toDateString() === targetDateStr);

          if (collidesWithHoliday || collidesWithManualDay) {
            log((logger) => logger.warn('Refused to move a holiday onto an occupied date', { targetDateStr }));
            return;
          }

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

        toggleDaySelection: ({ date, totalPtoDays, locale, allowPastDays }) => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays, holidays } = get();
          const dateStr = date.toDateString();

          if (!currentSelection) return false;

          const isSuggested = currentSelection.days.some((d) => d.toDateString() === dateStr);
          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === dateStr);
          const wasRemoved = removedSuggestedDays.some((d) => d.toDateString() === dateStr);

          const isAlreadyFree = isWeekend(date) || holidays.some((h) => ensureDate(h.date).toDateString() === dateStr);

          if (!isSuggested && !isManuallySelected && isAlreadyFree) {
            log((logger) => logger.warn('Refused to spend a PTO day on a day that is already off', { dateStr }));
            return false;
          }

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
              log((logger) =>
                logger.warn('No remaining PTO days to assign', {
                  totalPtoDays,
                  activeSuggestedCount,
                  manualSelectedCount,
                })
              );
              return false;
            }

            updatedManualDays = [...manuallySelectedDays, ensureDate(date)].toSorted(
              (a, b) => a.getTime() - b.getTime()
            );
          }

          const updatedMetrics = generateMetrics({
            suggestion: currentSelection,
            locale,
            year: useFiltersStore.getState().year,
            bridges: currentSelection.bridges,
            holidays,
            allowPastDays,
            manuallySelectedDays: updatedManualDays,
            removedSuggestedDays: updatedRemovedDays,
            carryOverMonths: useFiltersStore.getState().carryOverMonths,
            totalPtoBudget: totalPtoDays,
          });

          set({
            manuallySelectedDays: updatedManualDays,
            removedSuggestedDays: updatedRemovedDays,
            currentSelection: { ...currentSelection, metrics: updatedMetrics },
          });
          return true;
        },

        pruneDaysOutsideWindow: (params?: PlanningWindowParams) => {
          const { year, carryOverMonths } = params ?? useFiltersStore.getState();
          const planningWindow = getPlanningWindow({ year, carryOverMonths });
          const { manuallySelectedDays, removedSuggestedDays } = get();

          const isInWindow = (date: Date) => isWithinInterval(date, planningWindow);
          const prunedManualDays = manuallySelectedDays.filter(isInWindow);
          const prunedRemovedDays = removedSuggestedDays.filter(isInWindow);

          if (
            prunedManualDays.length === manuallySelectedDays.length &&
            prunedRemovedDays.length === removedSuggestedDays.length
          ) {
            return;
          }

          set({ manuallySelectedDays: prunedManualDays, removedSuggestedDays: prunedRemovedDays });
        },

        clearCalculation: () => {
          set({
            suggestion: null,
            alternatives: [],
            currentSelection: null,
            previewAlternativeIndex: 0,
            currentSelectionIndex: 0,
            removedSuggestedDays: [],
            hasCalculated: true,
          });
        },

        resetManualSelection: () => {
          const { currentSelection, currentSelectionIndex, suggestion, alternatives, planRevision } = get();

          if (!currentSelection) {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
              planRevision: planRevision + 1,
            });
            return;
          }

          const baseSelection = currentSelectionIndex === 0 ? suggestion : alternatives[currentSelectionIndex - 1];

          if (baseSelection) {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
              currentSelection: baseSelection,
              planRevision: planRevision + 1,
            });
          } else {
            set({
              manuallySelectedDays: [],
              removedSuggestedDays: [],
              planRevision: planRevision + 1,
            });
          }
        },

        trimManualDays: (maxPtoDays: number) => {
          const { manuallySelectedDays } = get();
          if (manuallySelectedDays.length > maxPtoDays) {
            set({ manuallySelectedDays: manuallySelectedDays.slice(0, maxPtoDays) });
          }
        },

        getRemainingDays: (totalPtoDays: number) => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays } = get();
          const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
          const manualSelectedCount = manuallySelectedDays.length;
          return Math.max(0, totalPtoDays - activeSuggestedCount - manualSelectedCount);
        },

        getFreeDaysForMonth: (month: Date) => {
          const { holidays } = get();
          return holidays.filter((h) => isSameMonth(h.date, month) && h.isInSelectedRange).length;
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: obfuscatedStorage,
        partialize: partializeHolidays,
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            log((logger) =>
              logger.logError('Error rehydrating holidays store', error, {
                storeName: STORAGE_NAME,
                hasState: !!state,
              })
            );
            globalThis.localStorage?.removeItem(STORAGE_NAME);
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

            if (state.currentSelectionIndex > (state.alternatives?.length ?? 0)) {
              state.currentSelectionIndex = 0;
              state.currentSelection = state.suggestion;
            }
            state.previewAlternativeIndex = state.currentSelectionIndex;

            state.pruneDaysOutsideWindow();
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
