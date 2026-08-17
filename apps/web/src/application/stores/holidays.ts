import { holidayDTO, isInPlanningWindow } from '@application/dto/holiday/dto';
import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { logClient } from '@application/shared/utils/clientLog';
import { fromStoredInstant } from '@application/shared/utils/dateIntake';
import {
  addMonths,
  endOfMonth,
  endOfYear,
  isSameMonth,
  isWeekend,
  isWithinInterval,
} from '@application/shared/utils/dates';
import { generateMetrics } from '@domain/calendar/metrics/generateMetrics';
import type { MeasuredSuggestion, Suggestion } from '@domain/calendar/types';
import { measureBudget } from '@domain/calendar/utils/budget';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { obfuscatedStorage } from './crypto';
import { useFiltersStore } from './filters';
import {
  type AddHolidayParams,
  type AlternativeSelectionBaseParams,
  type DayOutcome,
  DayRefusal,
  type EditHolidayParams,
  type FetchHolidaysParams,
  type HolidayOutcome,
  HolidayRefusal,
  type MainThreadSuggestionsParams,
  type PlanningWindowParams,
} from './types';

export interface HolidaysState {
  holidays: HolidayDTO[];
  suggestion: MeasuredSuggestion | null;
  maxAlternatives: number;
  alternatives: MeasuredSuggestion[];
  currentSelection: MeasuredSuggestion | null;
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
  setCalculationResult: (result: { suggestion: MeasuredSuggestion; alternatives: MeasuredSuggestion[] }) => void;
  setMaxAlternatives: (max: number) => void;
  setCurrentAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  setPreviewAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
  resetToDefaults: () => void;
  addHoliday: (params: AddHolidayParams) => HolidayOutcome;
  editHoliday: (params: EditHolidayParams) => HolidayOutcome;
  removeHoliday: (holidayId: string) => void;
  toggleDaySelection: (params: {
    date: Date;
    totalPtoDays: number;
    locale: Locale;
    allowPastDays: boolean;
  }) => DayOutcome;
  pruneDaysOutsideWindow: (params?: PlanningWindowParams) => void;
  clearCalculation: () => void;
  resetManualSelection: () => void;
  trimManualDays: (maxPtoDays: number) => void;
  getFreeDaysForMonth: (month: Date) => number;
}

type HolidaysStore = HolidaysState & HolidaysActions;

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

const partializeHolidays = (state: HolidaysStore) => ({
  holidays: state.holidays,
  suggestion: state.suggestion,
  maxAlternatives: state.maxAlternatives,
  alternatives: state.alternatives,
  currentSelection: state.currentSelection,
  currentSelectionIndex: state.currentSelectionIndex,
  manuallySelectedDays: state.manuallySelectedDays,
  removedSuggestedDays: state.removedSuggestedDays,
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
                date: fromStoredInstant(h.date),
                year: params.year,
                carryOverMonths: params.carryOverMonths,
              }),
            }));

          try {
            const { getHolidays } = await import('@infrastructure/services/holidays/getHolidays');
            const holidays = await getHolidays(params);
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
            logClient((logger) =>
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
          carryOverMonths,
          ptoDays,
          allowPastDays,
          strategy,
          locale,
          autoSuggestCount,
        }: MainThreadSuggestionsParams) => {
          const { holidays, maxAlternatives, manuallySelectedDays, removedSuggestedDays } = get();

          try {
            const { runPlanningPipeline } = await import('@domain/calendar/pipeline');

            const { planned, suggestion, alternatives } = runPlanningPipeline({
              window: { year, carryOverMonths },
              ptoDays,
              autoSuggestCount,
              holidays: holidayDTO.normalize(holidays),
              manuallySelectedDays,
              removedSuggestedDays,
              allowPastDays,
              strategy,
              locale,
              maxAlternatives,
            });

            if (!planned) {
              set({
                suggestion: null,
                alternatives: [],
                currentSelection: null,
                previewAlternativeIndex: 0,
                currentSelectionIndex: 0,
              });
              return;
            }

            set({
              suggestion,
              alternatives,
              currentSelection: suggestion,
              previewAlternativeIndex: 0,
              currentSelectionIndex: 0,
            });
          } catch (error) {
            logClient((logger) =>
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
          suggestion: MeasuredSuggestion;
          alternatives: MeasuredSuggestion[];
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

        addHoliday: ({ holiday, year, carryOverMonths }) => {
          const { holidays, manuallySelectedDays } = get();
          const existingHoliday = holidays.find((h) => h.date.toDateString() === holiday.date.toDateString());

          if (existingHoliday) {
            logClient((logger) =>
              logger.warn('Holiday already exists on this date', { date: holiday.date.toISOString() })
            );
            return { applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY, heldBy: existingHoliday };
          }

          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === holiday.date.toDateString());

          if (isManuallySelected) {
            logClient((logger) =>
              logger.warn('A PTO day is already booked on this date', { date: holiday.date.toISOString() })
            );
            return { applied: false, reason: HolidayRefusal.DATE_HELD_BY_MANUAL_DAY };
          }

          const newHoliday = holidayDTO.createCustom({
            name: holiday.name,
            date: holiday.date,
            year,
            carryOverMonths,
          });

          set({
            holidays: [...holidays, newHoliday].toSorted((a, b) => a.date.getTime() - b.date.getTime()),
          });

          return { applied: true };
        },

        removeHoliday: (holidayId: string) => {
          const { holidays } = get();
          set({
            holidays: holidays.filter((h) => h.id !== holidayId),
          });
        },

        editHoliday: ({ holidayId, updates, year, carryOverMonths }: EditHolidayParams) => {
          const { holidays, manuallySelectedDays } = get();
          const holidayIndex = holidays.findIndex((h) => h.id === holidayId);

          if (holidayIndex === -1) return { applied: false, reason: HolidayRefusal.HOLIDAY_NOT_FOUND };

          const targetDateStr = fromStoredInstant(updates.date).toDateString();
          const heldBy = holidays.find(
            (h, index) => index !== holidayIndex && fromStoredInstant(h.date).toDateString() === targetDateStr
          );
          const collidesWithManualDay = manuallySelectedDays.some((d) => d.toDateString() === targetDateStr);

          if (heldBy || collidesWithManualDay) {
            logClient((logger) => logger.warn('Refused to move a holiday onto an occupied date', { targetDateStr }));

            return heldBy
              ? { applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY, heldBy }
              : { applied: false, reason: HolidayRefusal.DATE_HELD_BY_MANUAL_DAY };
          }

          const updatedHoliday = holidayDTO.createCustom({
            name: updates.name,
            date: updates.date,
            year,
            carryOverMonths,
          });

          const updatedHolidays = [
            ...holidays.slice(0, holidayIndex),
            updatedHoliday,
            ...holidays.slice(holidayIndex + 1),
          ].toSorted((a, b) => a.date.getTime() - b.date.getTime());

          set({ holidays: updatedHolidays });

          return { applied: true };
        },

        toggleDaySelection: ({ date, totalPtoDays, locale, allowPastDays }) => {
          const { manuallySelectedDays, currentSelection, removedSuggestedDays, holidays } = get();
          const dateStr = date.toDateString();

          if (!currentSelection) return { applied: false, reason: DayRefusal.NO_PLAN };

          const isSuggested = currentSelection.days.some((d) => d.toDateString() === dateStr);
          const isManuallySelected = manuallySelectedDays.some((d) => d.toDateString() === dateStr);
          const wasRemoved = removedSuggestedDays.some((d) => d.toDateString() === dateStr);

          const holidayOnDate = holidays.find((h) => fromStoredInstant(h.date).toDateString() === dateStr);

          if (!isSuggested && !isManuallySelected && (isWeekend(date) || holidayOnDate)) {
            logClient((logger) => logger.warn('Refused to spend a PTO day on a day that is already off', { dateStr }));

            if (holidayOnDate) {
              return {
                applied: false,
                reason:
                  holidayOnDate.variant === HolidayVariant.CUSTOM
                    ? DayRefusal.DAY_IS_CUSTOM_HOLIDAY
                    : DayRefusal.DAY_IS_HOLIDAY,
              };
            }

            return { applied: false, reason: DayRefusal.DAY_IS_WEEKEND };
          }

          let updatedManualDays = manuallySelectedDays;
          let updatedRemovedDays = removedSuggestedDays;

          if (isManuallySelected) {
            updatedManualDays = manuallySelectedDays.filter((d) => d.toDateString() !== dateStr);
          } else if (isSuggested && wasRemoved) {
            updatedRemovedDays = removedSuggestedDays.filter((d) => d.toDateString() !== dateStr);
          } else if (isSuggested && !wasRemoved) {
            updatedRemovedDays = [...removedSuggestedDays, fromStoredInstant(date)].toSorted(
              (a, b) => a.getTime() - b.getTime()
            );
          } else {
            const budget = measureBudget({
              ptoDays: totalPtoDays,
              days: currentSelection.days,
              manuallySelectedDays,
              removedSuggestedDays,
            });

            if (budget.remaining <= 0) {
              logClient((logger) =>
                logger.warn('No remaining PTO days to assign', { totalPtoDays, spent: budget.spent })
              );
              return { applied: false, reason: DayRefusal.BUDGET_EXHAUSTED };
            }

            updatedManualDays = [...manuallySelectedDays, fromStoredInstant(date)].toSorted(
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

          return { applied: true };
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
            logClient((logger) =>
              logger.logError('Error rehydrating holidays store', error, {
                storeName: STORAGE_NAME,
                hasState: !!state,
              })
            );
            globalThis.localStorage?.removeItem(STORAGE_NAME);
            return;
          }

          if (state) {
            const reviveSuggestion = (s: Suggestion | null): MeasuredSuggestion | null => {
              if (!s?.metrics) return null;

              return {
                ...s,
                metrics: s.metrics,
                days: s.days.map(fromStoredInstant),
                bridges: s.bridges?.map((b) => ({
                  ...b,
                  startDate: fromStoredInstant(b.startDate),
                  endDate: fromStoredInstant(b.endDate),
                  ptoDays: b.ptoDays.map(fromStoredInstant),
                })),
              };
            };

            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: fromStoredInstant(h.date),
              }));
            }

            if (state.suggestion) {
              state.suggestion = reviveSuggestion(state.suggestion);
            }

            if (state.alternatives) {
              state.alternatives = state.alternatives
                .map(reviveSuggestion)
                .filter((alt): alt is MeasuredSuggestion => alt !== null);
            }

            if (state.currentSelection) {
              state.currentSelection = reviveSuggestion(state.currentSelection);
            }

            if (state.manuallySelectedDays) {
              state.manuallySelectedDays = state.manuallySelectedDays.map(fromStoredInstant);
            }

            if (state.removedSuggestedDays) {
              state.removedSuggestedDays = state.removedSuggestedDays.map(fromStoredInstant);
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
