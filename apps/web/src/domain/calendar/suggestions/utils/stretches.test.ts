import { dayIndex } from "@application/shared/utils/dates";
import { describe, expect, it } from "vitest";
import { longestWorkStretch, workStretchesOf } from "./stretches";

const september = (day: number) => dayIndex(new Date(2026, 8, day));

describe("workStretchesOf", () => {
	it("keeps a weekend inside one stretch of work", () => {
		const workdays = [21, 22, 23, 24, 25, 28, 29].map(september);

		expect(workStretchesOf(workdays)).toEqual([{ start: 0, end: 6 }]);
	});

	it("ends a stretch at a weekday that is not a Workday", () => {
		const workdays = [21, 22, 24, 25, 28].map(september);

		expect(workStretchesOf(workdays)).toEqual([
			{ start: 0, end: 1 },
			{ start: 2, end: 4 },
		]);
	});

	it("answers no stretch for no Workdays", () => {
		expect(workStretchesOf([])).toEqual([]);
	});
});

describe("longestWorkStretch", () => {
	const workdays = [21, 22, 23, 24, 25, 28, 29, 30].map(september);

	it("counts the Workdays of the longest stretch", () => {
		expect(longestWorkStretch({ workdays, off: new Set() })).toBe(8);
	});

	it("splits a stretch at a day taken off", () => {
		expect(longestWorkStretch({ workdays, off: new Set([september(24)]) })).toBe(4);
	});

	it("answers nought when every Workday is off", () => {
		expect(longestWorkStretch({ workdays, off: new Set(workdays) })).toBe(0);
	});
});
