import { monthKeyOf } from "@domain/calendar/window";
import { describe, expect, it } from "vitest";
import type { Bridge } from "../types";
import { measurePlan } from "./measures";

const jan = (day: number) => new Date(2025, 0, day);

const FRIDAY: Bridge = {
	startDate: jan(10),
	endDate: jan(12),
	ptoDays: [jan(10)],
	ptoDaysNeeded: 1,
	effectiveDays: 3,
	efficiency: 3,
};

const MONDAY: Bridge = {
	startDate: jan(11),
	endDate: jan(13),
	ptoDays: [jan(13)],
	ptoDaysNeeded: 1,
	effectiveDays: 3,
	efficiency: 3,
};

const WORKDAYS = [6, 7, 8, 9, 10, 13, 14, 15, 16, 17].map(jan);

const measure = (overrides: Partial<Parameters<typeof measurePlan>[0]> = {}) =>
	measurePlan({
		plan: { days: [jan(10), jan(13)], bridges: [FRIDAY, MONDAY] },
		alreadyOff: [],
		manualDays: [],
		workdays: WORKDAYS,
		preferredMonths: [],
		...overrides,
	});

describe("measurePlan", () => {
	it("counts a weekend two Bridges share once", () => {
		expect(measure().covered).toBe(4);
	});

	it("counts a placed day no Bridge covers as itself", () => {
		expect(measure({ plan: { days: [jan(10), jan(15)], bridges: [FRIDAY] } }).covered).toBe(4);
	});

	it("counts the Manual Days' own streaks as covered", () => {
		expect(measure({ alreadyOff: [jan(15)] }).covered).toBe(5);
	});

	it("divides by every day spent, the Manual Days included, as the Metrics do", () => {
		expect(measure({ alreadyOff: [jan(15)], manualDays: [jan(15)] }).efficiency).toBeCloseTo(5 / 3);
	});

	it("answers nought Efficiency for a plan that spent nothing, rather than NaN", () => {
		expect(measure({ plan: { days: [], bridges: [] } }).efficiency).toBe(0);
	});

	it("reports the longest covered run as the Longest Vacation", () => {
		expect(measure({ plan: { days: [jan(10), jan(13), jan(16)], bridges: [FRIDAY, MONDAY] } }).longestVacation).toBe(4);
	});

	it("counts a run towards the Preferred Months only when its placed days all fall in them", () => {
		expect(measure({ preferredMonths: [monthKeyOf(jan(1))] }).longestPreferredVacation).toBe(4);
		expect(measure({ preferredMonths: [monthKeyOf(new Date(2025, 6, 1))] }).longestPreferredVacation).toBe(0);
	});

	it("reads no Preferred Months as every month", () => {
		expect(measure().longestPreferredVacation).toBe(4);
	});

	it("measures the longest stretch of work the plan leaves", () => {
		expect(measure().longestWorkStretch).toBe(4);
	});
});
