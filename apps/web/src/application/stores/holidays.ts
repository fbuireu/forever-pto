import { holidayDTO, isInPlanningWindow, planningWindowInterval } from "@application/dto/holiday/dto";
import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { logClient, logClientError } from "@application/shared/utils/clientLog";
import { fromStoredInstant, type Stored } from "@application/shared/utils/dateIntake";
import { isSameDay, isWeekend } from "@application/shared/utils/dates";
import { generateMetrics } from "@domain/calendar/metrics/generateMetrics";
import type { MeasuredSuggestion, Suggestion } from "@domain/calendar/types";
import { measureBudget } from "@domain/calendar/utils/budget";
import type { Locale } from "next-intl";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { obfuscatedStorage } from "./crypto";
import { useFiltersStore } from "./filters";
import { onRehydrateFailure } from "./rehydration";
import {
	type AddHolidayParams,
	type AlternativePreviewParams,
	type AlternativeSelectionBaseParams,
	type DayOutcome,
	DayRefusal,
	type EditHolidayParams,
	type FetchHolidaysParams,
	type HolidayOutcome,
	HolidayRefusal,
	type MainThreadSuggestionsParams,
	type PlanningWindowParams,
} from "./types";

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

interface HeldOnParams {
	date: Date;
	exceptHolidayIndex?: number;
}

interface DateHolder {
	holiday?: HolidayDTO;
	manualDay: boolean;
}

interface HolidaysActions {
	fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
	generateSuggestions: (params: MainThreadSuggestionsParams) => Promise<void>;
	setCalculating: (v: boolean) => void;
	setCalculationResult: (result: { suggestion: MeasuredSuggestion; alternatives: MeasuredSuggestion[] }) => void;
	setMaxAlternatives: (max: number) => void;
	setCurrentAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
	setPreviewAlternativeSelection: (params: AlternativePreviewParams) => void;
	resetToDefaults: () => void;
	heldOn: (params: HeldOnParams) => DateHolder;
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
}

type HolidaysStore = HolidaysState & HolidaysActions;

const STORAGE_NAME = "holidays-store";
const STORAGE_VERSION = 1;

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

export type PersistedHolidays = ReturnType<typeof partializeHolidays>;

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
					const planningWindow = planningWindowInterval(params);
					const customHolidays = currentHolidays
						.filter((h) => h.variant === HolidayVariant.CUSTOM)
						.map((h) => ({
							...h,
							isInSelectedRange: isInPlanningWindow({ date: h.date, window: planningWindow }),
						}));

					try {
						const { getHolidays } = await import("@infrastructure/services/holidays/getHolidays");
						const holidays = await getHolidays(params);
						const filteredHolidays = holidays.filter(
							(fetchedHoliday) =>
								!customHolidays.some((custom) => isSameDay({ a: custom.date, b: fetchedHoliday.date })),
						);
						set({
							holidays: [...customHolidays, ...filteredHolidays].toSorted(
								(a, b) => a.date.getTime() - b.date.getTime(),
							),
						});
					} catch (error) {
						logClientError({
							message: "Error fetching holidays in holidays store",
							error,
							context: {
								year: params.year,
								country: params.country,
								region: params.region,
							},
						});
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
						const { runPlanningPipeline } = await import("@domain/calendar/pipeline");

						const { planned, suggestion, alternatives } = runPlanningPipeline({
							window: { year, carryOverMonths },
							ptoDays,
							autoSuggestCount,
							holidays,
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
						logClientError({
							message: "Error generating suggestions in holidays store",
							error,
							context: {
								year,
								ptoDays,
								holidaysCount: holidays.length,
								allowPastDays,
								strategy,
								locale,
							},
						});
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

				setPreviewAlternativeSelection: ({ index }: AlternativePreviewParams) => {
					set({ previewAlternativeIndex: index });
				},

				resetToDefaults: () => {
					set({ ...holidaysInitialState });
				},

				heldOn: ({ date, exceptHolidayIndex }) => {
					const { holidays, manuallySelectedDays } = get();

					return {
						holiday: holidays.find(
							(holiday, index) => index !== exceptHolidayIndex && isSameDay({ a: holiday.date, b: date }),
						),
						manualDay: manuallySelectedDays.some((day) => isSameDay({ a: day, b: date })),
					};
				},

				addHoliday: ({ holiday, year, carryOverMonths }) => {
					const { holidays } = get();
					const { holiday: existingHoliday, manualDay } = get().heldOn({ date: holiday.date });

					if (existingHoliday) {
						logClient((logger) =>
							logger.warn("Holiday already exists on this date", { date: holiday.date.toISOString() }),
						);
						return { applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY, heldBy: existingHoliday };
					}

					if (manualDay) {
						logClient((logger) =>
							logger.warn("A PTO day is already booked on this date", { date: holiday.date.toISOString() }),
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
					const { holidays } = get();
					const holidayIndex = holidays.findIndex((h) => h.id === holidayId);

					if (holidayIndex === -1) return { applied: false, reason: HolidayRefusal.HOLIDAY_NOT_FOUND };

					const { holiday: heldBy, manualDay: collidesWithManualDay } = get().heldOn({
						date: updates.date,
						exceptHolidayIndex: holidayIndex,
					});

					if (heldBy || collidesWithManualDay) {
						const targetDateStr = updates.date.toDateString();
						logClient((logger) => logger.warn("Refused to move a holiday onto an occupied date", { targetDateStr }));

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

					const isSuggested = currentSelection.days.some((day) => isSameDay({ a: day, b: date }));
					const wasRemoved = removedSuggestedDays.some((day) => isSameDay({ a: day, b: date }));

					const { holiday: holidayOnDate, manualDay: isManuallySelected } = get().heldOn({ date });

					if (!isSuggested && !isManuallySelected && (isWeekend(date) || holidayOnDate)) {
						logClient((logger) => logger.warn("Refused to spend a PTO day on a day that is already off", { dateStr }));

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
						updatedManualDays = manuallySelectedDays.filter((day) => !isSameDay({ a: day, b: date }));
					} else if (isSuggested && wasRemoved) {
						updatedRemovedDays = removedSuggestedDays.filter((day) => !isSameDay({ a: day, b: date }));
					} else if (isSuggested && !wasRemoved) {
						updatedRemovedDays = [...removedSuggestedDays, date].toSorted((a, b) => a.getTime() - b.getTime());
					} else {
						const budget = measureBudget({
							ptoDays: totalPtoDays,
							days: currentSelection.days,
							manuallySelectedDays,
							removedSuggestedDays,
						});

						if (budget.remaining <= 0) {
							logClient((logger) =>
								logger.warn("No remaining PTO days to assign", { totalPtoDays, spent: budget.spent }),
							);
							return { applied: false, reason: DayRefusal.BUDGET_EXHAUSTED };
						}

						updatedManualDays = [...manuallySelectedDays, date].toSorted((a, b) => a.getTime() - b.getTime());
					}

					const { year, carryOverMonths } = useFiltersStore.getState();
					const updatedMetrics = generateMetrics({
						suggestion: currentSelection,
						locale,
						planningWindow: { year, carryOverMonths },
						holidays,
						allowPastDays,
						manuallySelectedDays: updatedManualDays,
						removedSuggestedDays: updatedRemovedDays,
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
					const { manuallySelectedDays, removedSuggestedDays } = get();

					const planningWindow = planningWindowInterval({ year, carryOverMonths });
					const isInWindow = (date: Date) => isInPlanningWindow({ date, window: planningWindow });
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
			}),
			{
				name: STORAGE_NAME,
				version: STORAGE_VERSION,
				storage: obfuscatedStorage,
				partialize: partializeHolidays,
				onRehydrateStorage: () => (state, error) => {
					if (error) {
						onRehydrateFailure({ storeName: STORAGE_NAME, error, state });
						return;
					}

					if (state) {
						const stored = state as unknown as Stored<PersistedHolidays>;

						const reviveSuggestion = (s: Stored<Suggestion> | null): MeasuredSuggestion | null => {
							if (!s?.metrics) return null;

							return {
								...s,
								metrics: s.metrics,
								strategy: s.strategy,
								days: s.days.map(fromStoredInstant),
								bridges: s.bridges?.map((b) => ({
									...b,
									startDate: fromStoredInstant(b.startDate),
									endDate: fromStoredInstant(b.endDate),
									ptoDays: b.ptoDays.map(fromStoredInstant),
								})),
							};
						};

						if (stored.holidays) {
							state.holidays = stored.holidays.map((h) => ({
								...h,
								date: fromStoredInstant(h.date),
							}));
						}

						if (stored.suggestion) {
							state.suggestion = reviveSuggestion(stored.suggestion);
						}

						if (stored.alternatives) {
							state.alternatives = stored.alternatives
								.map(reviveSuggestion)
								.filter((alt): alt is MeasuredSuggestion => alt !== null);
						}

						if (stored.currentSelection) {
							state.currentSelection = reviveSuggestion(stored.currentSelection);
						}

						if (stored.manuallySelectedDays) {
							state.manuallySelectedDays = stored.manuallySelectedDays.map(fromStoredInstant);
						}

						if (stored.removedSuggestedDays) {
							state.removedSuggestedDays = stored.removedSuggestedDays.map(fromStoredInstant);
						}

						if (state.currentSelectionIndex > (state.alternatives?.length ?? 0)) {
							state.currentSelectionIndex = 0;
							state.currentSelection = state.suggestion;
						}
						state.previewAlternativeIndex = state.currentSelectionIndex;

						state.pruneDaysOutsideWindow();
					}
				},
			},
		),
		{ name: STORAGE_NAME },
	),
);
