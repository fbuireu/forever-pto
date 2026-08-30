import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import type { generateMetrics } from "@domain/calendar/metrics/generateMetrics";
import type { runPlanningPipeline } from "@domain/calendar/pipeline";
import { FilterStrategy, type MeasuredSuggestion } from "@domain/calendar/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFiltersStore } from "./filters";
import { type HolidaysState, useHolidaysStore } from "./holidays";
import { DayRefusal, HolidayRefusal } from "./types";

const { mockGetHolidays, mockRunPlanningPipeline, mockStorageGetItem } = vi.hoisted(() => ({
	mockGetHolidays: vi.fn().mockResolvedValue([]),
	mockRunPlanningPipeline: vi.fn<typeof runPlanningPipeline>(),
	mockStorageGetItem: vi.fn().mockResolvedValue(null),
}));

vi.mock("@infrastructure/services/holidays/getHolidays", () => ({
	getHolidays: mockGetHolidays,
}));
vi.mock("@domain/calendar/pipeline", () => ({
	runPlanningPipeline: mockRunPlanningPipeline,
}));

const { mockLogError, mockWarn } = vi.hoisted(() => ({ mockLogError: vi.fn(), mockWarn: vi.fn() }));

vi.mock("@infrastructure/clients/logging/better-stack/client", () => ({
	getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError, warn: mockWarn }),
}));

vi.mock("./crypto", () => ({
	obfuscatedStorage: {
		getItem: mockStorageGetItem,
		setItem: vi.fn().mockResolvedValue(undefined),
		removeItem: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("./location", () => ({
	useLocationStore: { getState: vi.fn().mockReturnValue({ regions: [] }) },
}));

vi.mock("@application/dto/holiday/dto", () => ({
	holidayDTO: {
		createCustom: vi.fn(({ name, date }: { name: string; date: Date }) => ({
			id: `custom-${date.toISOString()}`,
			name,
			date,
			variant: HolidayVariant.CUSTOM,
			isInPlanningWindow: true,
		})),
	},
}));

vi.mock("@domain/calendar/metrics/generateMetrics", () => ({
	generateMetrics: vi.fn<typeof generateMetrics>().mockReturnValue({
		longWeekends: 0,
		restBlocks: 0,
		maxWorkStreak: 0,
		firstLastBreak: null,
		averageEfficiency: 0,
		bonusDays: 0,
		quarterDist: [0, 0, 0, 0],
		bridgesUsed: 0,
		workedDaysPerMonth: 0,
		totalEffectiveDays: 0,
		monthlyDist: Array.from({ length: 12 }, () => 0),
		longBlocksPerQuarter: [0, 0, 0, 0],
		longestVacation: 0,
	}),
}));

interface MakeHolidayParams {
	id: string;
	dateStr: string;
	variant?: HolidayVariant;
}

const makeHoliday = ({ id, dateStr, variant = HolidayVariant.NATIONAL }: MakeHolidayParams): HolidayDTO => ({
	id,
	date: new Date(dateStr),
	name: `Holiday ${id}`,
	variant,
	isInPlanningWindow: true,
});

interface MakeBridgeParams {
	start: Date;
	end: Date;
	ptoDays: Date[];
}

const makeBridge = ({ start, end, ptoDays }: MakeBridgeParams) => ({
	startDate: start,
	endDate: end,
	ptoDaysNeeded: ptoDays.length,
	effectiveDays: 0,
	efficiency: 0,
	ptoDays,
});

const makeSuggestion = (days: Date[]): MeasuredSuggestion => ({
	days,
	bridges: days.length ? [makeBridge({ start: days[0], end: days[days.length - 1], ptoDays: days })] : [],
	metrics: { totalDays: days.length } as never,
});

const INITIAL = {
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
};

beforeEach(() => {
	useHolidaysStore.setState(INITIAL);
	vi.clearAllMocks();
	mockRunPlanningPipeline.mockReturnValue({ planned: true, suggestion: makeSuggestion([]), alternatives: [] });
});

describe("toggleDaySelection refuses days that are already off", () => {
	const SUGGESTION = { days: [], bridges: [], metrics: null } as never;

	beforeEach(() => {
		useHolidaysStore.setState({
			currentSelection: SUGGESTION,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
			holidays: [],
		});
	});

	it("refuses a weekend, which costs budget and buys nothing", () => {
		const saturday = new Date(2026, 2, 14);
		expect(saturday.getDay()).toBe(6);

		const accepted = useHolidaysStore
			.getState()
			.toggleDaySelection({ date: saturday, totalPtoDays: 10, locale: "en" as const, allowPastDays: true });

		expect(accepted.applied).toBe(false);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
	});

	it("refuses a day that any Holiday already covers, Custom ones included", () => {
		const date = new Date(2026, 2, 11);
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM })],
		});

		const accepted = useHolidaysStore
			.getState()
			.toggleDaySelection({ date, totalPtoDays: 10, locale: "en" as const, allowPastDays: true });

		expect(accepted.applied).toBe(false);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
	});

	it("still accepts an ordinary Workday", () => {
		const wednesday = new Date(2026, 2, 11);
		expect(wednesday.getDay()).toBe(3);

		const accepted = useHolidaysStore
			.getState()
			.toggleDaySelection({ date: wednesday, totalPtoDays: 10, locale: "en" as const, allowPastDays: true });

		expect(accepted.applied).toBe(true);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
	});

	it("still lets an existing Manual Day be removed even once a Holiday has landed on it", () => {
		const date = new Date(2026, 2, 11);
		useHolidaysStore.setState({
			manuallySelectedDays: [date],
			holidays: [makeHoliday({ id: "national-1", dateStr: "2026-03-11" })],
		});

		const accepted = useHolidaysStore
			.getState()
			.toggleDaySelection({ date, totalPtoDays: 10, locale: "en" as const, allowPastDays: true });

		expect(accepted.applied).toBe(true);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
	});

	it("names the weekend as the reason, so the caller need not re-derive it", () => {
		const saturday = new Date("2026-03-14");

		const outcome = useHolidaysStore
			.getState()
			.toggleDaySelection({ date: saturday, totalPtoDays: 10, locale: "en" as const, allowPastDays: true });

		expect(outcome).toEqual({ applied: false, reason: DayRefusal.DAY_IS_WEEKEND });
	});

	it("tells a Custom Holiday apart from a National one in the reason", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM })],
		});

		const custom = useHolidaysStore.getState().toggleDaySelection({
			date: new Date("2026-03-11"),
			totalPtoDays: 10,
			locale: "en" as const,
			allowPastDays: true,
		});

		expect(custom).toEqual({ applied: false, reason: DayRefusal.DAY_IS_CUSTOM_HOLIDAY });

		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "national-1", dateStr: "2026-03-11" })] });

		const national = useHolidaysStore.getState().toggleDaySelection({
			date: new Date("2026-03-11"),
			totalPtoDays: 10,
			locale: "en" as const,
			allowPastDays: true,
		});

		expect(national).toEqual({ applied: false, reason: DayRefusal.DAY_IS_HOLIDAY });
	});

	it("names an exhausted budget as the reason", () => {
		useHolidaysStore.setState({
			currentSelection: { days: [new Date("2026-03-09")], bridges: [], metrics: null } as never,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});

		const outcome = useHolidaysStore.getState().toggleDaySelection({
			date: new Date("2026-03-11"),
			totalPtoDays: 1,
			locale: "en" as const,
			allowPastDays: true,
		});

		expect(outcome).toEqual({ applied: false, reason: DayRefusal.BUDGET_EXHAUSTED });
	});
});

describe("editHoliday collisions", () => {
	it("lets a holiday keep its own date, since it cannot collide with itself", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM })],
			manuallySelectedDays: [],
		});

		const outcome = useHolidaysStore.getState().editHoliday({
			holidayId: "custom-1",
			updates: { name: "Renamed, same day", date: new Date("2026-03-11") },
			year: 2026,
			carryOverMonths: 0,
		});

		const [holiday] = useHolidaysStore.getState().holidays;
		expect(outcome).toEqual({ applied: true });
		expect(holiday.name).toBe("Renamed, same day");
	});

	it("refuses to move a holiday onto a date already spent as a PTO day", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM })],
			manuallySelectedDays: [new Date("2026-03-12")],
		});

		useHolidaysStore.getState().editHoliday({
			holidayId: "custom-1",
			updates: { name: "Moved", date: new Date("2026-03-12") },
			year: 2026,
			carryOverMonths: 0,
		});

		const [holiday] = useHolidaysStore.getState().holidays;
		expect(holiday.date.toDateString()).toBe(new Date("2026-03-11").toDateString());
	});

	it("refuses to move a holiday onto another holiday", () => {
		useHolidaysStore.setState({
			holidays: [
				makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM }),
				makeHoliday({ id: "national-1", dateStr: "2026-03-12" }),
			],
		});

		useHolidaysStore.getState().editHoliday({
			holidayId: "custom-1",
			updates: { name: "Moved", date: new Date("2026-03-12") },
			year: 2026,
			carryOverMonths: 0,
		});

		const moved = useHolidaysStore.getState().holidays.find((h) => h.id === "custom-1");
		expect(moved?.date.toDateString()).toBe(new Date("2026-03-11").toDateString());
	});

	it("still moves a holiday onto a free date", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM })],
			manuallySelectedDays: [new Date("2026-03-12")],
		});

		useHolidaysStore.getState().editHoliday({
			holidayId: "custom-1",
			updates: { name: "Moved", date: new Date("2026-03-13") },
			year: 2026,
			carryOverMonths: 0,
		});

		const [holiday] = useHolidaysStore.getState().holidays;
		expect(holiday.date.toDateString()).toBe(new Date("2026-03-13").toDateString());
	});
});

describe("the refusal reason crosses the seam", () => {
	it("hands addHoliday the Holiday that already holds the date, so the caller need not look it up", () => {
		const held = makeHoliday({ id: "custom-1", dateStr: "2026-03-11", variant: HolidayVariant.CUSTOM });
		useHolidaysStore.setState({ holidays: [held] });

		const outcome = useHolidaysStore.getState().addHoliday({
			holiday: { name: "Company day", date: new Date("2026-03-11") },
			year: 2026,
			carryOverMonths: 0,
		});

		expect(outcome).toEqual({ applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY, heldBy: held });
	});

	it("tells a Manual Day collision apart from a Holiday collision", () => {
		useHolidaysStore.setState({ manuallySelectedDays: [new Date("2026-03-11")] });

		const outcome = useHolidaysStore.getState().addHoliday({
			holiday: { name: "Company day", date: new Date("2026-03-11") },
			year: 2026,
			carryOverMonths: 0,
		});

		expect(outcome).toEqual({ applied: false, reason: HolidayRefusal.DATE_HELD_BY_MANUAL_DAY });
	});

	it("reports a missing Holiday rather than silently doing nothing", () => {
		const outcome = useHolidaysStore.getState().editHoliday({
			holidayId: "nope",
			updates: { name: "Moved", date: new Date("2026-03-12") },
			year: 2026,
			carryOverMonths: 0,
		});

		expect(outcome).toEqual({ applied: false, reason: HolidayRefusal.HOLIDAY_NOT_FOUND });
	});
});

describe("addHoliday", () => {
	it("refuses a date already spent as a PTO day, which would otherwise be paid for twice", () => {
		const date = new Date("2026-03-10");
		useHolidaysStore.setState({ manuallySelectedDays: [date] });

		useHolidaysStore.getState().addHoliday({
			holiday: { name: "Company day", date: new Date("2026-03-10") },
			year: 2026,
			carryOverMonths: 0,
		});

		expect(useHolidaysStore.getState().holidays).toHaveLength(0);
	});

	it("still adds a holiday on a date no PTO day occupies", () => {
		useHolidaysStore.setState({ manuallySelectedDays: [new Date("2026-03-10")] });

		useHolidaysStore.getState().addHoliday({
			holiday: { name: "Company day", date: new Date("2026-03-11") },
			year: 2026,
			carryOverMonths: 0,
		});

		expect(useHolidaysStore.getState().holidays).toHaveLength(1);
	});

	it("adds a new holiday to the list", () => {
		const date = new Date("2026-01-01");
		useHolidaysStore.getState().addHoliday({
			holiday: { name: "New Year", date, type: "public" },
			year: 2026,
			carryOverMonths: 1,
		});
		expect(useHolidaysStore.getState().holidays).toHaveLength(1);
		expect(useHolidaysStore.getState().holidays[0].name).toBe("New Year");
	});

	it("does not add a holiday when one already exists on the same date", () => {
		const date = new Date("2026-01-01");
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });
		useHolidaysStore.getState().addHoliday({
			holiday: { name: "Duplicate", date, type: "public" },
			year: 2026,
			carryOverMonths: 1,
		});
		expect(useHolidaysStore.getState().holidays).toHaveLength(1);
	});

	it("warns about the duplicate without blocking the action on the logging client", async () => {
		const date = new Date("2026-01-01");
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });

		useHolidaysStore.getState().addHoliday({
			holiday: { name: "Duplicate", date, type: "public" },
			year: 2026,
			carryOverMonths: 1,
		});

		expect(mockWarn).not.toHaveBeenCalled();
		await vi.waitFor(() =>
			expect(mockWarn).toHaveBeenCalledWith("Holiday already exists on this date", { date: date.toISOString() }),
		);
	});

	it("sorts holidays by date after adding", () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-06-01" })] });
		const earlyDate = new Date("2026-01-15");
		useHolidaysStore.getState().addHoliday({
			holiday: { name: "Early", date: earlyDate, type: "public" },
			year: 2026,
			carryOverMonths: 1,
		});
		const { holidays } = useHolidaysStore.getState();
		expect(holidays[0].date.getTime()).toBeLessThan(holidays[1].date.getTime());
	});
});

describe("removeHoliday", () => {
	it("removes the holiday with the given id", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" }), makeHoliday({ id: "h2", dateStr: "2026-02-01" })],
		});
		useHolidaysStore.getState().removeHoliday("h1");
		const { holidays } = useHolidaysStore.getState();
		expect(holidays).toHaveLength(1);
		expect(holidays[0].id).toBe("h2");
	});

	it("does nothing when id does not exist", () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });
		useHolidaysStore.getState().removeHoliday("nonexistent");
		expect(useHolidaysStore.getState().holidays).toHaveLength(1);
	});
});

describe("editHoliday", () => {
	it("replaces the holiday at the matching index", () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });
		const newDate = new Date("2026-03-15");
		useHolidaysStore.getState().editHoliday({
			holidayId: "h1",
			updates: { name: "Renamed", date: newDate },
			year: 2026,
			carryOverMonths: 1,
		});
		const { holidays } = useHolidaysStore.getState();
		expect(holidays[0].name).toBe("Renamed");
		expect(holidays[0].date).toEqual(newDate);
	});

	it("does nothing when holidayId is not found", () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });
		useHolidaysStore.getState().editHoliday({
			holidayId: "missing",
			updates: { name: "X", date: new Date() },
			year: 2026,
			carryOverMonths: 1,
		});
		expect(useHolidaysStore.getState().holidays[0].id).toBe("h1");
	});
});

describe("setMaxAlternatives", () => {
	it("sets the value", () => {
		useHolidaysStore.getState().setMaxAlternatives(6);
		expect(useHolidaysStore.getState().maxAlternatives).toBe(6);
	});

	it("clamps to 0 for negative values", () => {
		useHolidaysStore.getState().setMaxAlternatives(-1);
		expect(useHolidaysStore.getState().maxAlternatives).toBe(0);
	});
});

describe("setCalculationResult", () => {
	it("stores suggestion and alternatives", () => {
		const suggestion = makeSuggestion([new Date("2026-05-01")]);
		const alternatives = [makeSuggestion([new Date("2026-06-01")])];
		useHolidaysStore.getState().setCalculationResult({ suggestion, alternatives });
		const state = useHolidaysStore.getState();
		expect(state.suggestion).toBe(suggestion);
		expect(state.alternatives).toEqual(alternatives);
		expect(state.currentSelection?.days).toEqual(suggestion.days);
		expect(state.removedSuggestedDays).toHaveLength(0);
	});

	it("preserves currentSelectionIndex within bounds", () => {
		const s1 = makeSuggestion([new Date("2026-05-01")]);
		const s2 = makeSuggestion([new Date("2026-06-01")]);
		useHolidaysStore.setState({ currentSelectionIndex: 1 });
		useHolidaysStore.getState().setCalculationResult({ suggestion: s1, alternatives: [s2] });
		expect(useHolidaysStore.getState().currentSelectionIndex).toBe(1);
		expect(useHolidaysStore.getState().currentSelection).toBe(s2);
	});

	it("resets to index 0 when previous index is out of bounds", () => {
		useHolidaysStore.setState({ currentSelectionIndex: 5 });
		const s = makeSuggestion([new Date("2026-05-01")]);
		useHolidaysStore.getState().setCalculationResult({ suggestion: s, alternatives: [] });
		expect(useHolidaysStore.getState().currentSelectionIndex).toBe(0);
	});
});

describe("resetManualSelection", () => {
	it("clears manually selected and removed days", () => {
		useHolidaysStore.setState({
			manuallySelectedDays: [new Date("2026-01-03")],
			removedSuggestedDays: [new Date("2026-01-01")],
			currentSelection: null,
		});
		useHolidaysStore.getState().resetManualSelection();
		const state = useHolidaysStore.getState();
		expect(state.manuallySelectedDays).toHaveLength(0);
		expect(state.removedSuggestedDays).toHaveLength(0);
	});

	it("restores currentSelection to base when index is 0", () => {
		const suggestion = makeSuggestion([new Date("2026-01-01")]);
		const modified = { ...suggestion, metrics: { totalDays: 99 } as never };
		useHolidaysStore.setState({
			suggestion,
			alternatives: [],
			currentSelection: modified,
			currentSelectionIndex: 0,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		useHolidaysStore.getState().resetManualSelection();
		expect(useHolidaysStore.getState().currentSelection).toBe(suggestion);
	});

	it("bumps planRevision so the freed budget is re-planned", () => {
		const suggestion = makeSuggestion([new Date("2026-01-01")]);
		useHolidaysStore.setState({
			suggestion,
			alternatives: [],
			currentSelection: suggestion,
			currentSelectionIndex: 0,
			manuallySelectedDays: [new Date("2026-01-03")],
			removedSuggestedDays: [],
			planRevision: 4,
		});

		useHolidaysStore.getState().resetManualSelection();

		expect(useHolidaysStore.getState().planRevision).toBe(5);
	});

	it("bumps planRevision even when there is no current selection", () => {
		useHolidaysStore.setState({
			currentSelection: null,
			manuallySelectedDays: [new Date("2026-01-03")],
			removedSuggestedDays: [],
			planRevision: 0,
		});

		useHolidaysStore.getState().resetManualSelection();

		expect(useHolidaysStore.getState().planRevision).toBe(1);
	});
});

describe("trimManualDays", () => {
	it("trims manuallySelectedDays to maxPtoDays", () => {
		useHolidaysStore.setState({
			manuallySelectedDays: [new Date("2026-01-01"), new Date("2026-01-02"), new Date("2026-01-03")],
		});
		useHolidaysStore.getState().trimManualDays(2);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(2);
	});

	it("does nothing when length is within limit", () => {
		useHolidaysStore.setState({
			manuallySelectedDays: [new Date("2026-01-01")],
		});
		useHolidaysStore.getState().trimManualDays(5);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
	});
});

describe("toggleDaySelection", () => {
	const baseDate = new Date("2026-05-11");
	const PARAMS = { totalPtoDays: 5, locale: "en" as const, allowPastDays: false };

	it("refuses with no_plan when there is no currentSelection", () => {
		useHolidaysStore.setState({ currentSelection: null });
		expect(useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS })).toEqual({
			applied: false,
			reason: DayRefusal.NO_PLAN,
		});
	});

	it("removes a day from manuallySelectedDays when already manually selected", () => {
		const suggestion = makeSuggestion([]);
		useHolidaysStore.setState({
			currentSelection: suggestion,
			manuallySelectedDays: [baseDate],
			removedSuggestedDays: [],
		});
		const result = useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
		expect(result.applied).toBe(true);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
	});

	it("re-adds a suggested day that was removed", () => {
		const suggestion = makeSuggestion([baseDate]);
		useHolidaysStore.setState({
			currentSelection: suggestion,
			manuallySelectedDays: [],
			removedSuggestedDays: [baseDate],
		});
		useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
		expect(useHolidaysStore.getState().removedSuggestedDays).toHaveLength(0);
	});

	it("removes a suggested day that was not yet removed", () => {
		const suggestion = makeSuggestion([baseDate]);
		useHolidaysStore.setState({
			currentSelection: suggestion,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
		expect(useHolidaysStore.getState().removedSuggestedDays).toHaveLength(1);
	});

	it("recomputes the metrics against the planning year held by the filters store", async () => {
		const { generateMetrics } = await import("@domain/calendar/metrics/generateMetrics");
		useFiltersStore.setState({ year: 2029 });
		useHolidaysStore.setState({
			currentSelection: makeSuggestion([baseDate]),
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
		expect(vi.mocked(generateMetrics).mock.lastCall?.[0].planningWindow.year).toBe(2029);
	});

	it("returns false and does not add a day when no remaining budget", () => {
		const suggestion = makeSuggestion([
			new Date("2026-05-01"),
			new Date("2026-05-02"),
			new Date("2026-05-03"),
			new Date("2026-05-04"),
			new Date("2026-05-05"),
		]);
		useHolidaysStore.setState({
			currentSelection: suggestion,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		const result = useHolidaysStore
			.getState()
			.toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: "en" as const, allowPastDays: false });
		expect(result.applied).toBe(false);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
	});

	it("adds an unselected day when budget allows", () => {
		const suggestion = makeSuggestion([new Date("2026-05-01")]);
		useHolidaysStore.setState({
			currentSelection: suggestion,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		const result = useHolidaysStore
			.getState()
			.toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: "en" as const, allowPastDays: false });
		expect(result.applied).toBe(true);
		expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
	});
});

describe("setCalculating", () => {
	it("sets isCalculating to true", () => {
		useHolidaysStore.getState().setCalculating(true);
		expect(useHolidaysStore.getState().isCalculating).toBe(true);
	});

	it("sets isCalculating to false", () => {
		useHolidaysStore.setState({ isCalculating: true });
		useHolidaysStore.getState().setCalculating(false);
		expect(useHolidaysStore.getState().isCalculating).toBe(false);
	});
});

describe("setCurrentAlternativeSelection", () => {
	it("sets currentSelection and both indices", () => {
		const suggestion = makeSuggestion([new Date("2026-06-01")]);
		useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion, index: 2 });
		const state = useHolidaysStore.getState();
		expect(state.currentSelection?.days).toEqual(suggestion.days);
		expect(state.currentSelectionIndex).toBe(2);
		expect(state.previewAlternativeIndex).toBe(2);
	});

	it("drops the Removed Days, which named days of the Suggestion being replaced", () => {
		useHolidaysStore.setState({ removedSuggestedDays: [new Date("2026-01-06")] });
		useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion: makeSuggestion([]), index: 0 });
		expect(useHolidaysStore.getState().removedSuggestedDays).toHaveLength(0);
	});

	it("keeps the Manual Days, which every Alternative was planned around", () => {
		const manual = new Date("2026-01-05");
		useHolidaysStore.setState({ manuallySelectedDays: [manual] });

		useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion: makeSuggestion([]), index: 0 });

		expect(useHolidaysStore.getState().manuallySelectedDays).toEqual([manual]);
	});

	it("asks for a re-plan, which is what reconciles a Manual Day added since the last run", () => {
		const before = useHolidaysStore.getState().planRevision;

		useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion: makeSuggestion([]), index: 1 });

		expect(useHolidaysStore.getState().planRevision).toBe(before + 1);
	});

	it("adopts the chosen plan verbatim, leaving its Bridges for the re-plan to rebuild", () => {
		const suggestion = makeSuggestion([new Date("2026-06-01")]);

		useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion, index: 1 });

		expect(useHolidaysStore.getState().currentSelection).toBe(suggestion);
	});
});

describe("setPreviewAlternativeSelection", () => {
	it("sets previewAlternativeIndex", () => {
		useHolidaysStore.getState().setPreviewAlternativeSelection({ index: 1 });
		expect(useHolidaysStore.getState().previewAlternativeIndex).toBe(1);
	});

	it("does not modify currentSelection or manuallySelectedDays", () => {
		const currentSuggestion = makeSuggestion([new Date("2026-05-01")]);
		useHolidaysStore.setState({
			currentSelection: currentSuggestion,
			manuallySelectedDays: [new Date("2026-01-10")],
		});
		useHolidaysStore.getState().setPreviewAlternativeSelection({ index: 1 });
		const state = useHolidaysStore.getState();
		expect(state.currentSelection).toBe(currentSuggestion);
		expect(state.manuallySelectedDays).toHaveLength(1);
	});
});

describe("resetToDefaults", () => {
	it("resets all state to initial values", () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })],
			maxAlternatives: 8,
			isCalculating: true,
			manuallySelectedDays: [new Date("2026-01-05")],
			currentSelectionIndex: 3,
			suggestion: makeSuggestion([new Date("2026-05-01")]),
		});
		useHolidaysStore.getState().resetToDefaults();
		const state = useHolidaysStore.getState();
		expect(state.holidays).toHaveLength(0);
		expect(state.maxAlternatives).toBe(4);
		expect(state.isCalculating).toBe(false);
		expect(state.manuallySelectedDays).toHaveLength(0);
		expect(state.currentSelectionIndex).toBe(0);
		expect(state.suggestion).toBeNull();
		expect(state.currentSelection).toBeNull();
		expect(state.alternatives).toHaveLength(0);
	});
});

describe("fetchHolidays", () => {
	const FETCH_PARAMS = { year: 2026, country: "ES", region: "", carryOverMonths: 1, locale: "en" as const };

	it("recomputes isInPlanningWindow on carried-over Custom Holidays, since only flagged ones can anchor a Bridge", async () => {
		const custom = makeHoliday({ id: "custom-1", dateStr: "2026-06-15", variant: HolidayVariant.CUSTOM });
		useHolidaysStore.setState({ holidays: [custom] });
		mockGetHolidays.mockResolvedValueOnce([]);

		await useHolidaysStore.getState().fetchHolidays({ ...FETCH_PARAMS, year: 2027 });

		const carried = useHolidaysStore.getState().holidays.find((h) => h.id === "custom-1");
		expect(carried?.isInPlanningWindow).toBe(false);
	});

	it("flags a Custom Holiday the window has moved back onto", async () => {
		const custom: HolidayDTO = {
			...makeHoliday({ id: "custom-1", dateStr: "2026-06-15", variant: HolidayVariant.CUSTOM }),
			isInPlanningWindow: false,
		};
		useHolidaysStore.setState({ holidays: [custom] });
		mockGetHolidays.mockResolvedValueOnce([]);

		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);

		const carried = useHolidaysStore.getState().holidays.find((h) => h.id === "custom-1");
		expect(carried?.isInPlanningWindow).toBe(true);
	});

	it("sets fetched holidays sorted by date", async () => {
		const h1 = makeHoliday({ id: "h1", dateStr: "2026-06-01" });
		const h2 = makeHoliday({ id: "h2", dateStr: "2026-01-15" });
		mockGetHolidays.mockResolvedValueOnce([h1, h2]);
		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
		const { holidays } = useHolidaysStore.getState();
		expect(holidays).toHaveLength(2);
		expect(holidays[0].date.getTime()).toBeLessThan(holidays[1].date.getTime());
	});

	it("preserves custom holidays and drops fetched holidays with the same date", async () => {
		const custom = makeHoliday({ id: "custom-1", dateStr: "2026-05-01", variant: HolidayVariant.CUSTOM });
		const duplicate = makeHoliday({ id: "fetched-1", dateStr: "2026-05-01" });
		const other = makeHoliday({ id: "fetched-2", dateStr: "2026-06-01" });
		useHolidaysStore.setState({ holidays: [custom] });
		mockGetHolidays.mockResolvedValueOnce([duplicate, other]);
		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
		const { holidays } = useHolidaysStore.getState();
		expect(holidays).toHaveLength(2);
		expect(holidays.find((h) => h.id === "custom-1")).toBeDefined();
		expect(holidays.find((h) => h.id === "fetched-1")).toBeUndefined();
	});

	it("keeps custom holidays and drops the fetched ones on error", async () => {
		const custom = makeHoliday({ id: "custom-1", dateStr: "2026-05-01", variant: HolidayVariant.CUSTOM });
		useHolidaysStore.setState({ holidays: [custom, makeHoliday({ id: "national-1", dateStr: "2026-01-01" })] });
		mockGetHolidays.mockRejectedValueOnce(new Error("network error"));
		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
		expect(useHolidaysStore.getState().holidays).toEqual([custom]);
	});

	it("sets holidays to empty on error when there are no custom holidays", async () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "national-1", dateStr: "2026-01-01" })] });
		mockGetHolidays.mockRejectedValueOnce(new Error("network error"));
		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
		expect(useHolidaysStore.getState().holidays).toHaveLength(0);
	});

	it("logs the failure with the planning inputs", async () => {
		mockGetHolidays.mockRejectedValueOnce(new Error("network error"));

		await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);

		await vi.waitFor(() =>
			expect(mockLogError).toHaveBeenCalledWith("Error fetching holidays in holidays store", expect.any(Error), {
				year: 2026,
				country: "ES",
				region: "",
			}),
		);
	});
});

describe("pruneDaysOutsideWindow", () => {
	const WINDOW = { year: 2026, carryOverMonths: 1 };
	const inYear = new Date(2026, 6, 15);
	const inCarryOver = new Date(2027, 0, 20);
	const beforeWindow = new Date(2025, 11, 31);
	const afterWindow = new Date(2027, 1, 1);

	it("keeps the last day of the last carry-over month, which is where the two window definitions could differ", () => {
		const lastDay = new Date(2027, 0, 31);
		const firstDayAfter = new Date(2027, 1, 1);
		useHolidaysStore.setState({ manuallySelectedDays: [lastDay, firstDayAfter] });

		useHolidaysStore.getState().pruneDaysOutsideWindow(WINDOW);

		expect(useHolidaysStore.getState().manuallySelectedDays).toEqual([lastDay]);
	});

	it("keeps only the manual days inside the planning window", () => {
		useHolidaysStore.setState({ manuallySelectedDays: [beforeWindow, inYear, inCarryOver, afterWindow] });
		useHolidaysStore.getState().pruneDaysOutsideWindow(WINDOW);
		expect(useHolidaysStore.getState().manuallySelectedDays).toEqual([inYear, inCarryOver]);
	});

	it("keeps only the removed suggested days inside the planning window", () => {
		useHolidaysStore.setState({ removedSuggestedDays: [inYear, afterWindow] });
		useHolidaysStore.getState().pruneDaysOutsideWindow(WINDOW);
		expect(useHolidaysStore.getState().removedSuggestedDays).toEqual([inYear]);
	});

	it("drops carry-over days once the window no longer reaches them", () => {
		useHolidaysStore.setState({ manuallySelectedDays: [inYear, inCarryOver] });
		useHolidaysStore.getState().pruneDaysOutsideWindow({ year: 2026, carryOverMonths: 0 });
		expect(useHolidaysStore.getState().manuallySelectedDays).toEqual([inYear]);
	});

	it("leaves the arrays untouched when every day is inside the window", () => {
		const manuallySelectedDays = [inYear, inCarryOver];
		useHolidaysStore.setState({ manuallySelectedDays });
		useHolidaysStore.getState().pruneDaysOutsideWindow(WINDOW);
		expect(useHolidaysStore.getState().manuallySelectedDays).toBe(manuallySelectedDays);
	});

	it("falls back to the window held by the filters store", () => {
		useFiltersStore.setState({ year: 2026, carryOverMonths: 1 });
		useHolidaysStore.setState({ manuallySelectedDays: [inYear, afterWindow] });
		useHolidaysStore.getState().pruneDaysOutsideWindow();
		expect(useHolidaysStore.getState().manuallySelectedDays).toEqual([inYear]);
	});
});

describe("persistence", () => {
	const persist = (state: Partial<HolidaysState>) => {
		const partialize = useHolidaysStore.persist.getOptions().partialize;
		const persisted = partialize?.({ ...useHolidaysStore.getState(), ...state });
		return JSON.parse(JSON.stringify(persisted));
	};

	const rehydrateFrom = async (state: Partial<HolidaysState>) => {
		mockStorageGetItem.mockResolvedValueOnce({ state: persist(state), version: 1 });
		await useHolidaysStore.persist.rehydrate();
		return useHolidaysStore.getState();
	};

	beforeEach(() => {
		useFiltersStore.setState({ year: 2026, carryOverMonths: 1 });
	});

	it("revives persisted days as Date instances", async () => {
		const state = await rehydrateFrom({
			holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })],
			suggestion: makeSuggestion([new Date(2026, 4, 1)]),
			currentSelection: makeSuggestion([new Date(2026, 4, 1)]),
			manuallySelectedDays: [new Date(2026, 6, 15)],
			removedSuggestedDays: [new Date(2026, 7, 20)],
		});
		expect(state.holidays[0].date).toBeInstanceOf(Date);
		expect(state.suggestion?.days[0]).toBeInstanceOf(Date);
		expect(state.currentSelection?.days[0]).toBeInstanceOf(Date);
		expect(state.manuallySelectedDays[0]).toEqual(new Date(2026, 6, 15));
		expect(state.removedSuggestedDays[0]).toEqual(new Date(2026, 7, 20));
	});

	it("revives the Dates nested inside a Bridge, two levels down", async () => {
		const day = new Date(2026, 4, 1);
		const state = await rehydrateFrom({
			suggestion: makeSuggestion([day]),
			currentSelection: makeSuggestion([day]),
			alternatives: [makeSuggestion([new Date(2026, 5, 2)])],
		});

		const bridge = state.suggestion?.bridges?.[0];
		expect(bridge?.startDate).toEqual(day);
		expect(bridge?.endDate).toEqual(day);
		expect(bridge?.ptoDays[0]).toEqual(day);
		expect(state.currentSelection?.bridges?.[0].startDate).toEqual(day);
		expect(state.alternatives[0].bridges?.[0].ptoDays[0]).toEqual(new Date(2026, 5, 2));
	});

	it("restores the applied alternative and mirrors its index into the preview", async () => {
		const alternatives = [makeSuggestion([new Date(2026, 1, 2)]), makeSuggestion([new Date(2026, 2, 3)])];
		const state = await rehydrateFrom({
			suggestion: makeSuggestion([new Date(2026, 0, 1)]),
			alternatives,
			currentSelection: alternatives[1],
			currentSelectionIndex: 2,
		});
		expect(state.currentSelectionIndex).toBe(2);
		expect(state.previewAlternativeIndex).toBe(2);
		expect(state.currentSelection?.days[0]).toEqual(new Date(2026, 2, 3));
	});

	it("falls back to the base suggestion when the persisted index names no alternative", async () => {
		const suggestion = makeSuggestion([new Date(2026, 0, 1)]);
		const state = await rehydrateFrom({
			suggestion,
			alternatives: [],
			currentSelection: makeSuggestion([new Date(2026, 2, 3)]),
			currentSelectionIndex: 3,
		});
		expect(state.currentSelectionIndex).toBe(0);
		expect(state.currentSelection?.days).toEqual(suggestion.days);
	});

	it.each(["bank", "", "NATIONAL"])(
		"drops a stored holiday whose variant %s names no Holiday Variant, so the tables and the charts count the same set",
		async (variant) => {
			const state = await rehydrateFrom({
				holidays: [
					makeHoliday({ id: "keep", dateStr: "2026-01-01" }),
					{ ...makeHoliday({ id: "drop", dateStr: "2026-01-06" }), variant: variant as HolidayVariant },
				],
			});

			expect(state.holidays.map((holiday) => holiday.id)).toEqual(["keep"]);
		},
	);

	it.each(Object.values(HolidayVariant))("keeps a stored holiday whose variant is %s", async (variant) => {
		const state = await rehydrateFrom({
			holidays: [{ ...makeHoliday({ id: "keep", dateStr: "2026-01-01" }), variant }],
		});

		expect(state.holidays.map((holiday) => holiday.id)).toEqual(["keep"]);
	});

	it("prunes days belonging to another planning window", async () => {
		const state = await rehydrateFrom({
			manuallySelectedDays: [new Date(2026, 6, 15), new Date(2027, 6, 15)],
			removedSuggestedDays: [new Date(2027, 6, 16)],
		});
		expect(state.manuallySelectedDays).toEqual([new Date(2026, 6, 15)]);
		expect(state.removedSuggestedDays).toEqual([]);
	});

	it("clears the stored blob when rehydration fails", () => {
		const removeItem = vi.fn();
		vi.stubGlobal("localStorage", { removeItem });
		const listener = useHolidaysStore.persist.getOptions().onRehydrateStorage?.(useHolidaysStore.getState());
		expect(() => listener?.(undefined, new Error("deobfuscate failed"))).not.toThrow();
		expect(removeItem).toHaveBeenCalledWith("holidays-store");
		vi.unstubAllGlobals();
	});
});

describe("generateSuggestions", () => {
	const PARAMS = {
		year: 2026,
		ptoDays: 5,
		allowPastDays: false,
		carryOverMonths: 0,
		strategy: FilterStrategy.GROUPED,
		locale: "en" as const,
	};

	const planningInput = () => mockRunPlanningPipeline.mock.lastCall?.[0];

	it("hands the pipeline the calendar and the hand edits it holds in state", async () => {
		const holiday = makeHoliday({ id: "h1", dateStr: "2026-01-01" });
		const manual = new Date(2026, 2, 11);
		const removed = new Date(2026, 2, 12);
		useHolidaysStore.setState({
			holidays: [holiday],
			manuallySelectedDays: [manual],
			removedSuggestedDays: [removed],
			maxAlternatives: 2,
		});

		await useHolidaysStore.getState().generateSuggestions(PARAMS);

		expect(planningInput()).toMatchObject({
			holidays: [holiday],
			manuallySelectedDays: [manual],
			removedSuggestedDays: [removed],
			maxAlternatives: 2,
		});
	});

	it("hands the pipeline the planning inputs its caller passed, budget and cap included", async () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })] });

		await useHolidaysStore.getState().generateSuggestions({
			...PARAMS,
			ptoDays: 10,
			carryOverMonths: 2,
			autoSuggestCount: 3,
			allowPastDays: true,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(planningInput()).toMatchObject({
			window: { year: 2026, carryOverMonths: 2 },
			ptoDays: 10,
			autoSuggestCount: 3,
			allowPastDays: true,
			strategy: FilterStrategy.OPTIMIZED,
			locale: "en",
		});
	});

	it("clears the plan when the pipeline reports it did not plan, since this store has a null state and the wire does not", async () => {
		useHolidaysStore.setState({ holidays: [], suggestion: makeSuggestion([new Date("2026-06-01")]) });
		mockRunPlanningPipeline.mockReturnValueOnce({
			planned: false,
			suggestion: makeSuggestion([]),
			alternatives: [],
		});

		await useHolidaysStore.getState().generateSuggestions(PARAMS);

		const state = useHolidaysStore.getState();
		expect(state.suggestion).toBeNull();
		expect(state.alternatives).toHaveLength(0);
		expect(state.currentSelection).toBeNull();
		expect(state.currentSelectionIndex).toBe(0);
		expect(state.previewAlternativeIndex).toBe(0);
	});

	it("sets suggestion, alternatives, and currentSelection on success", async () => {
		useHolidaysStore.setState({ holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })], maxAlternatives: 1 });
		const days = [new Date("2026-06-01")];
		mockRunPlanningPipeline.mockReturnValueOnce({
			planned: true,
			suggestion: makeSuggestion(days),
			alternatives: [makeSuggestion([new Date("2026-07-01")])],
		});

		await useHolidaysStore.getState().generateSuggestions(PARAMS);

		const state = useHolidaysStore.getState();
		expect(state.suggestion).toMatchObject({ days });
		expect(state.alternatives).toHaveLength(1);
		expect(state.currentSelection).toBe(state.suggestion);
		expect(state.currentSelectionIndex).toBe(0);
		expect(state.previewAlternativeIndex).toBe(0);
	});

	it("clears suggestions on error", async () => {
		useHolidaysStore.setState({
			holidays: [makeHoliday({ id: "h1", dateStr: "2026-01-01" })],
			suggestion: makeSuggestion([]),
		});
		mockRunPlanningPipeline.mockImplementationOnce(() => {
			throw new Error("calc error");
		});

		await useHolidaysStore.getState().generateSuggestions(PARAMS);

		expect(useHolidaysStore.getState().suggestion).toBeNull();
		expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
	});
});

describe("every Metrics writer measures against the same Planning Window", () => {
	it("toggleDaySelection passes carryOverMonths, so one click cannot collapse the distributions", async () => {
		const { generateMetrics } = await import("@domain/calendar/metrics/generateMetrics");
		useFiltersStore.setState({ carryOverMonths: 2, year: 2026 });
		useHolidaysStore.setState({
			currentSelection: { days: [], bridges: [], metrics: null } as never,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
			holidays: [],
		});

		useHolidaysStore.getState().toggleDaySelection({
			date: new Date(2026, 2, 11),
			totalPtoDays: 10,
			locale: "en" as const,
			allowPastDays: true,
		});

		const [args] = vi.mocked(generateMetrics).mock.lastCall ?? [];
		expect(args?.planningWindow.carryOverMonths).toBe(2);
	});
});
