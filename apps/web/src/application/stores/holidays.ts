import { holidayDTO } from "@application/dto/holiday/dto";
import { type HolidayDTO, HolidayVariant, isHolidayVariant } from "@application/dto/holiday/types";
import { logClient, logClientError } from "@application/shared/utils/clientLog";
import { fromStoredInstant, type Stored } from "@application/shared/utils/dateIntake";
import { isSameDay, isWeekend } from "@application/shared/utils/dates";
import { generateMetrics } from "@domain/calendar/metrics/generateMetrics";
import type { MeasuredSuggestion, Suggestion } from "@domain/calendar/types";
import { measureBudget } from "@domain/calendar/utils/budget";
import { isInPlanningWindow, type PlanningWindow, planningWindowInterval } from "@domain/calendar/window";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { obfuscatedStorage } from "./crypto";
import { useFiltersStore } from "./filters";
import { onRehydrateFailure } from "./rehydration";
import { HOLIDAYS_STORAGE_NAME } from "./storedPlan";
import {
	type AddHolidayParams,
	type AlternativePreviewParams,
	type AlternativeSelectionBaseParams,
	DayChange,
	type DayOutcome,
	DayRefusal,
	type EditHolidayParams,
	type FetchHolidaysParams,
	type GenerateSuggestionsParams,
	type HolidayOutcome,
	HolidayRefusal,
	holidaysKeyOf,
	type SetCalculationResultParams,
	type ToggleDaySelectionParams,
} from "./types";
import { migrateHolidays } from "./utils/holidaysMigration";

export interface HolidaysState {
	holidays: HolidayDTO[];
	suggestion: MeasuredSuggestion | null;
	maxAlternatives: number;
	alternatives: MeasuredSuggestion[];
	currentSelection: MeasuredSuggestion | null;
	previewAlternativeIndex: number;
	currentSelectionIndex: number;
	manualDays: Date[];
	removedSuggestedDays: Date[];
	isCalculating: boolean;
	hasCalculated: boolean;
	planRevision: number;
	holidaysKey: string | null;
	planAskedFor: boolean;
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
	generateSuggestions: (params: GenerateSuggestionsParams) => Promise<void>;
	setCalculating: (v: boolean) => void;
	askForPlan: () => void;
	claimPlanAskedFor: () => boolean;
	setCalculationResult: (params: SetCalculationResultParams) => void;
	setCurrentAlternativeSelection: (params: AlternativeSelectionBaseParams) => void;
	setPreviewAlternativeSelection: (params: AlternativePreviewParams) => void;
	resetToDefaults: () => void;
	heldOn: (params: HeldOnParams) => DateHolder;
	addHoliday: (params: AddHolidayParams) => HolidayOutcome;
	editHoliday: (params: EditHolidayParams) => HolidayOutcome;
	removeHoliday: (holidayId: string) => void;
	toggleDaySelection: (params: ToggleDaySelectionParams) => DayOutcome;
	pruneDaysOutsideWindow: (window?: PlanningWindow) => void;
	clearCalculation: () => void;
	resetManualSelection: () => void;
	trimManualDays: (maxPtoDays: number) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const STORAGE_NAME = HOLIDAYS_STORAGE_NAME;

let latestHolidaysFetch = 0;
const STORAGE_VERSION = 2;

const holidaysInitialState: HolidaysState = {
	holidays: [],
	suggestion: null,
	maxAlternatives: 4,
	alternatives: [],
	currentSelection: null,
	previewAlternativeIndex: 0,
	currentSelectionIndex: 0,
	manualDays: [],
	removedSuggestedDays: [],
	isCalculating: false,
	hasCalculated: false,
	planRevision: 0,
	holidaysKey: null,
	planAskedFor: false,
};

export type PersistedHolidays = ReturnType<typeof partializeHolidays>;

const partializeHolidays = (state: HolidaysStore) => ({
	holidays: state.holidays,
	suggestion: state.suggestion,
	maxAlternatives: state.maxAlternatives,
	alternatives: state.alternatives,
	currentSelection: state.currentSelection,
	currentSelectionIndex: state.currentSelectionIndex,
	manualDays: state.manualDays,
	removedSuggestedDays: state.removedSuggestedDays,
});

export const useHolidaysStore = create<HolidaysStore>()(
	devtools(
		persist(
			(set, get) => ({
				...holidaysInitialState,

				fetchHolidays: async (params: FetchHolidaysParams) => {
					const fetchId = ++latestHolidaysFetch;
					const holidaysKey = holidaysKeyOf(params);
					const { holidays: currentHolidays } = get();
					const planningWindow = planningWindowInterval(params);
					const customHolidays = currentHolidays
						.filter((h) => h.variant === HolidayVariant.CUSTOM)
						.map((h) => ({
							...h,
							isInPlanningWindow: isInPlanningWindow({ date: h.date, window: planningWindow }),
						}));

					try {
						const { getHolidays } = await import("@infrastructure/services/holidays/getHolidays");
						const holidays = await getHolidays(params);
						if (fetchId !== latestHolidaysFetch) return;
						const filteredHolidays = holidays.filter(
							(fetchedHoliday) =>
								!customHolidays.some((custom) => isSameDay({ a: custom.date, b: fetchedHoliday.date })),
						);
						set({
							holidays: [...customHolidays, ...filteredHolidays].toSorted(
								(a, b) => a.date.getTime() - b.date.getTime(),
							),
							holidaysKey,
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
						if (fetchId !== latestHolidaysFetch) return;
						set({ holidays: customHolidays, holidaysKey });
					}
				},

				generateSuggestions: async ({
					year,
					carryOverMonths,
					ptoDays,
					allowPastDays,
					strategy,
					preferredMonths,
					locale,
				}: GenerateSuggestionsParams) => {
					const { holidays, maxAlternatives, manualDays, removedSuggestedDays } = get();

					try {
						const { runPlanningPipeline } = await import("@domain/calendar/pipeline");

						const { planned, suggestion, alternatives } = runPlanningPipeline({
							window: { year, carryOverMonths },
							ptoDays,
							holidays,
							manualDays,
							removedSuggestedDays,
							allowPastDays,
							strategy,
							preferredMonths,
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

				askForPlan: () => {
					set({ planAskedFor: true });
				},

				claimPlanAskedFor: () => {
					const { planAskedFor } = get();
					if (planAskedFor) set({ planAskedFor: false });
					return planAskedFor;
				},

				setCalculationResult: ({ suggestion, alternatives }: SetCalculationResultParams) => {
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
					const { holidays, manualDays } = get();

					return {
						holiday: holidays.find(
							(holiday, index) => index !== exceptHolidayIndex && isSameDay({ a: holiday.date, b: date }),
						),
						manualDay: manualDays.some((day) => isSameDay({ a: day, b: date })),
					};
				},

				addHoliday: ({ holiday, year, carryOverMonths }) => {
					const { holidays } = get();
					const { holiday: existingHoliday, manualDay } = get().heldOn({ date: holiday.date });

					if (existingHoliday) {
						logClient((logger) =>
							logger.warn({
								message: "Holiday already exists on this date",
								context: { date: holiday.date.toISOString() },
							}),
						);
						return { applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY, heldBy: existingHoliday };
					}

					if (manualDay) {
						logClient((logger) =>
							logger.warn({
								message: "A PTO day is already booked on this date",
								context: { date: holiday.date.toISOString() },
							}),
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
						logClient((logger) =>
							logger.warn({ message: "Refused to move a holiday onto an occupied date", context: { targetDateStr } }),
						);

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
					const { manualDays, currentSelection, removedSuggestedDays, holidays } = get();
					const dateStr = date.toDateString();

					if (!currentSelection) return { applied: false, reason: DayRefusal.NO_PLAN };

					const isSuggested = currentSelection.days.some((day) => isSameDay({ a: day, b: date }));
					const wasRemoved = removedSuggestedDays.some((day) => isSameDay({ a: day, b: date }));

					const { holiday: holidayOnDate, manualDay: isManual } = get().heldOn({ date });

					if (!isSuggested && !isManual && (isWeekend(date) || holidayOnDate)) {
						logClient((logger) =>
							logger.warn({ message: "Refused to spend a PTO day on a day that is already off", context: { dateStr } }),
						);

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

					let updatedManualDays = manualDays;
					let updatedRemovedDays = removedSuggestedDays;
					let change: DayChange;

					if (isManual) {
						updatedManualDays = manualDays.filter((day) => !isSameDay({ a: day, b: date }));
						change = DayChange.MANUAL_DAY_REMOVED;
					} else if (isSuggested && wasRemoved) {
						updatedRemovedDays = removedSuggestedDays.filter((day) => !isSameDay({ a: day, b: date }));
						change = DayChange.REMOVED_DAY_RESTORED;
					} else if (isSuggested && !wasRemoved) {
						updatedRemovedDays = [...removedSuggestedDays, date].toSorted((a, b) => a.getTime() - b.getTime());
						change = DayChange.SUGGESTED_DAY_REMOVED;
					} else {
						const budget = measureBudget({
							ptoDays: totalPtoDays,
							days: currentSelection.days,
							manualDays,
							removedSuggestedDays,
						});

						if (budget.remaining <= 0) {
							logClient((logger) =>
								logger.warn({
									message: "No remaining PTO days to assign",
									context: { totalPtoDays, spent: budget.spent },
								}),
							);
							return { applied: false, reason: DayRefusal.BUDGET_EXHAUSTED };
						}

						updatedManualDays = [...manualDays, date].toSorted((a, b) => a.getTime() - b.getTime());
						change = DayChange.MANUAL_DAY_ADDED;
					}

					const { year, carryOverMonths } = useFiltersStore.getState();
					const updatedMetrics = generateMetrics({
						suggestion: currentSelection,
						locale,
						planningWindow: { year, carryOverMonths },
						holidays,
						allowPastDays,
						manualDays: updatedManualDays,
						removedSuggestedDays: updatedRemovedDays,
					});

					set({
						manualDays: updatedManualDays,
						removedSuggestedDays: updatedRemovedDays,
						currentSelection: { ...currentSelection, metrics: updatedMetrics },
					});

					return { applied: true, change };
				},

				pruneDaysOutsideWindow: (window?: PlanningWindow) => {
					const { year, carryOverMonths } = window ?? useFiltersStore.getState();
					const { manualDays, removedSuggestedDays } = get();

					const planningWindow = planningWindowInterval({ year, carryOverMonths });
					const isInWindow = (date: Date) => isInPlanningWindow({ date, window: planningWindow });
					const prunedManualDays = manualDays.filter(isInWindow);
					const prunedRemovedDays = removedSuggestedDays.filter(isInWindow);

					if (
						prunedManualDays.length === manualDays.length &&
						prunedRemovedDays.length === removedSuggestedDays.length
					) {
						return;
					}

					set({ manualDays: prunedManualDays, removedSuggestedDays: prunedRemovedDays });
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
							manualDays: [],
							removedSuggestedDays: [],
							planRevision: planRevision + 1,
						});
						return;
					}

					const baseSelection = currentSelectionIndex === 0 ? suggestion : alternatives[currentSelectionIndex - 1];

					if (baseSelection) {
						set({
							manualDays: [],
							removedSuggestedDays: [],
							currentSelection: baseSelection,
							planRevision: planRevision + 1,
						});
					} else {
						set({
							manualDays: [],
							removedSuggestedDays: [],
							planRevision: planRevision + 1,
						});
					}
				},

				trimManualDays: (maxPtoDays: number) => {
					const { manualDays } = get();
					if (manualDays.length > maxPtoDays) {
						set({ manualDays: manualDays.slice(0, maxPtoDays) });
					}
				},
			}),
			{
				name: STORAGE_NAME,
				version: STORAGE_VERSION,
				storage: obfuscatedStorage,
				partialize: partializeHolidays,
				migrate: (persisted, version) => migrateHolidays({ persisted, version }) as PersistedHolidays,
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
							state.holidays = stored.holidays
								.filter((h) => isHolidayVariant(h.variant))
								.map((h) => ({
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

						if (stored.manualDays) {
							state.manualDays = stored.manualDays.map(fromStoredInstant);
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
