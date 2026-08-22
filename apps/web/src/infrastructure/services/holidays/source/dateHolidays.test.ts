import { beforeEach, describe, expect, it, vi } from "vitest";

const { HolidaysMock, constructorCalls, getHolidays, getStates } = vi.hoisted(() => {
	const constructorCalls: unknown[][] = [];
	const getHolidays = vi.fn((_year: number): unknown[] => []);
	const getStates = vi.fn(() => null as Record<string, string> | null);
	class HolidaysMock {
		getHolidays = getHolidays;
		getStates = getStates;
		constructor(...args: unknown[]) {
			constructorCalls.push(args);
		}
	}
	return { HolidaysMock, constructorCalls, getHolidays, getStates };
});

vi.mock("date-holidays", () => ({ default: HolidaysMock }));

const { dateHolidaysSource } = await import("./dateHolidays");

const LOOKUP = { country: "ES", year: 2026, locale: "es" };

beforeEach(() => {
	vi.clearAllMocks();
	constructorCalls.length = 0;
});

describe("dateHolidaysSource.rawHolidays", () => {
	it("asks for the Planning Window, which reaches into the following year", () => {
		dateHolidaysSource.rawHolidays(LOOKUP);
		expect(getHolidays.mock.calls.map(([year]) => year)).toEqual([2026, 2027]);
	});

	it("constructs one lookup for the Country and passes the locale to it", () => {
		dateHolidaysSource.rawHolidays(LOOKUP);
		expect(constructorCalls).toEqual([["ES", { languages: ["es"] }]]);
	});

	it("constructs a second, Region-scoped lookup only when a Region is given", () => {
		dateHolidaysSource.rawHolidays({ ...LOOKUP, region: "CT" });
		expect(constructorCalls).toEqual([
			["ES", { languages: ["es"] }],
			["ES", "CT", { languages: ["es"] }],
		]);
		expect(getHolidays.mock.calls.map(([year]) => year)).toEqual([2026, 2027, 2026, 2027]);
	});
});

describe("dateHolidaysSource.regionsOf", () => {
	it("lower-cases the Country, because getStates is keyed that way", () => {
		dateHolidaysSource.regionsOf("ES");
		expect(constructorCalls).toEqual([["ES"]]);
		expect(getStates).toHaveBeenCalledWith("es");
	});

	it("answers null rather than undefined for a Country with no Regions", () => {
		getStates.mockReturnValueOnce(undefined as unknown as null);
		expect(dateHolidaysSource.regionsOf("AD")).toBeNull();
	});

	it("passes the Regions through when there are some", () => {
		getStates.mockReturnValueOnce({ CT: "Catalunya" });
		expect(dateHolidaysSource.regionsOf("ES")).toEqual({ CT: "Catalunya" });
	});
});
