import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockFiltersState,
	mockHolidaysState,
	mockPrune,
	mockClearCalculation,
	mockFetchHolidays,
	mockTriggerCalculation,
	mockToggleDaySelection,
	capturedDayToggle,
} = vi.hoisted(() => ({
	mockFiltersState: {
		carryOverMonths: 0,
		year: 2026,
		allowPastDays: true,
		country: "ES",
		region: "",
		ptoDays: 10,
		strategy: "grouped",
	},
	mockHolidaysState: {
		holidays: [
			{ id: "h1", date: new Date(2026, 0, 1), name: "New Year", variant: "national", isInPlanningWindow: true },
		],
		alternatives: [],
		suggestion: null,
		currentSelection: null,
		isCalculating: false,
		hasCalculated: false,
		manualDays: [],
		removedSuggestedDays: [],
		previewAlternativeIndex: 0,
		planRevision: 0,
		holidaysKey: "ES||2026|0|en" as string | null,
	},
	mockPrune: vi.fn(),
	mockClearCalculation: vi.fn(),
	mockFetchHolidays: vi.fn(),
	mockTriggerCalculation: vi.fn(),
	mockToggleDaySelection: vi.fn(() => ({ applied: true })),
	capturedDayToggle: { current: null as ((date: Date) => { applied: boolean }) | null },
}));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: Object.assign((selector: (state: unknown) => unknown) => selector(mockFiltersState), {
		getState: () => mockFiltersState,
	}),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: Object.assign(
		(selector: (state: unknown) => unknown) =>
			selector({
				...mockHolidaysState,
				fetchHolidays: mockFetchHolidays,
				toggleDaySelection: mockToggleDaySelection,
				pruneDaysOutsideWindow: mockPrune,
				clearCalculation: mockClearCalculation,
			}),
		{ getState: () => mockHolidaysState },
	),
}));

vi.mock("@ui/hooks/useCalculationsWorker", () => ({
	useCalculationsWorker: () => ({ triggerCalculation: mockTriggerCalculation }),
}));

vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => ({ areStoresReady: true }) }));

vi.mock("boneyard-js/react", () => ({
	Skeleton: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string) => key,
}));

vi.mock("./calendar/Calendar", () => ({
	Calendar: ({ onDayToggle }: { onDayToggle: (date: Date) => { applied: boolean } }) => {
		capturedDayToggle.current = onDayToggle;
		return null;
	},
	CalendarSelectionMode: { MULTIPLE: "multiple" },
}));

vi.mock("./calendar/CalendarListFixture", () => ({ CalendarListFixture: () => null }));

vi.mock("./calendar/usePlannerDayClick", () => ({ usePlannerDayClick: (toggle: unknown) => toggle }));

const { CalendarList } = await import("./CalendarList");

beforeEach(() => {
	vi.clearAllMocks();
	mockFiltersState.year = 2026;
	mockFiltersState.carryOverMonths = 0;
	mockFiltersState.ptoDays = 10;
	mockHolidaysState.holidays = [
		{ id: "h1", date: new Date(2026, 0, 1), name: "New Year", variant: "national", isInPlanningWindow: true },
	] as never;
	mockHolidaysState.suggestion = null;
	mockHolidaysState.isCalculating = false;
	mockHolidaysState.hasCalculated = false;
	capturedDayToggle.current = null;
	(mockHolidaysState as { planRevision?: number }).planRevision = 0;
	mockHolidaysState.holidaysKey = "ES||2026|0|en";
});

describe("CalendarList does not re-plan itself", () => {
	it("does not start another run when the worker writes its result back", () => {
		const { rerender } = render(<CalendarList />);
		expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);

		mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;
		rerender(<CalendarList />);
		mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;
		rerender(<CalendarList />);

		expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);
	});
});

describe("CalendarList plans on the Holidays of the current filters", () => {
	it("waits while the Holidays loaded are for another year, then plans once they arrive", () => {
		mockHolidaysState.holidaysKey = "ES||2025|0|en";
		const { rerender } = render(<CalendarList />);

		expect(mockTriggerCalculation).not.toHaveBeenCalled();

		mockHolidaysState.holidaysKey = "ES||2026|0|en";
		rerender(<CalendarList />);

		expect(mockTriggerCalculation).toHaveBeenCalledOnce();
	});

	it("waits for the first fetch after a reload rather than planning on the persisted Holidays", () => {
		mockHolidaysState.holidaysKey = null;
		render(<CalendarList />);

		expect(mockTriggerCalculation).not.toHaveBeenCalled();
	});
});

describe("CalendarList re-plans on apply", () => {
	it("runs the engine again when a plan is applied, which is what reconciles the Manual Days", () => {
		const { rerender } = render(<CalendarList />);
		expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);

		(mockHolidaysState as { planRevision?: number }).planRevision = 1;
		rerender(<CalendarList />);

		expect(mockTriggerCalculation).toHaveBeenCalledTimes(2);
	});
});

describe("CalendarList stale plans", () => {
	it("clears the plan when the window has no Holidays left to build one from", () => {
		mockHolidaysState.holidays = [];
		mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;

		render(<CalendarList />);

		expect(mockClearCalculation).toHaveBeenCalled();
	});

	it("does not clear on a cold load, when there is no plan to go stale", () => {
		mockHolidaysState.holidays = [];
		mockHolidaysState.suggestion = null;

		render(<CalendarList />);

		expect(mockClearCalculation).not.toHaveBeenCalled();
	});
});

describe("CalendarList", () => {
	it("prunes hand-edited days whenever the planning window moves, so they stop spending budget", () => {
		const { rerender } = render(<CalendarList />);
		expect(mockPrune).toHaveBeenCalledWith({ year: 2026, carryOverMonths: 0 });

		mockPrune.mockClear();
		mockFiltersState.year = 2027;
		rerender(<CalendarList />);

		expect(mockPrune).toHaveBeenCalledWith({ year: 2027, carryOverMonths: 0 });
	});

	it("prunes when only the carry-over months move, which shifts the window without changing the year", () => {
		const { rerender } = render(<CalendarList />);
		mockPrune.mockClear();

		mockFiltersState.carryOverMonths = 3;
		rerender(<CalendarList />);

		expect(mockPrune).toHaveBeenCalledWith({ year: 2026, carryOverMonths: 3 });
	});
});

describe("CalendarList says what it is doing", () => {
	it("announces the run instead of silently repainting twelve calendars", () => {
		mockHolidaysState.isCalculating = true;

		const { container } = render(<CalendarList />);

		expect(container.querySelector('[role="status"]')?.textContent).toBe("calculating");
		expect(container.querySelector("#calendar")?.getAttribute("aria-busy")).toBe("true");
	});

	it("announces the finished run, so a reader knows the numbers settled", () => {
		mockHolidaysState.hasCalculated = true;

		const { container } = render(<CalendarList />);

		expect(container.querySelector('[role="status"]')?.textContent).toBe("planUpdated");
		expect(container.querySelector("#calendar")?.getAttribute("aria-busy")).toBe("false");
	});
});

describe("CalendarList blocks the keyboard on the same terms as the mouse", () => {
	it("refuses a day toggle while the worker is running, which pointer-events-none never did", () => {
		mockHolidaysState.isCalculating = true;
		render(<CalendarList />);

		const outcome = capturedDayToggle.current?.(new Date(2026, 0, 5));

		expect(outcome).toEqual({ applied: false, reason: "plan_in_flight" });
		expect(mockToggleDaySelection).not.toHaveBeenCalled();
	});

	it("lets the toggle through once the run has finished", () => {
		render(<CalendarList />);

		capturedDayToggle.current?.(new Date(2026, 0, 5));

		expect(mockToggleDaySelection).toHaveBeenCalledTimes(1);
	});

	it("keeps the day handler stable across a budget change, so the months are not re-rendered for it", () => {
		const { rerender } = render(<CalendarList />);
		const before = capturedDayToggle.current;

		mockFiltersState.ptoDays = 11;
		mockHolidaysState.isCalculating = true;
		rerender(<CalendarList />);

		expect(capturedDayToggle.current).toBe(before);
	});

	it("reads the budget at the click, not from the render that built the handler", () => {
		render(<CalendarList />);
		mockFiltersState.ptoDays = 12;

		capturedDayToggle.current?.(new Date(2026, 0, 5));

		expect(mockToggleDaySelection).toHaveBeenCalledWith(expect.objectContaining({ totalPtoDays: 12 }));
	});
});
