import { dayIndex } from "@application/shared/utils/dates";
import { describe, expect, it } from "vitest";
import { longestWorkStretch, workStretchesOf } from "./stretches";

const january = (day: number) => dayIndex(new Date(2025, 0, day));

describe("workStretchesOf", () => {
	it("keeps a weekend inside one stretch of work", () => {
		const workdays = [13, 14, 15, 16, 17, 20, 21].map(january);

		expect(workStretchesOf({ workdays })).toEqual([{ start: 0, end: 6 }]);
	});

	it("ends a stretch at a weekday that is not a Workday", () => {
		const workdays = [13, 14, 16, 17, 20].map(january);

		expect(workStretchesOf({ workdays })).toEqual([
			{ start: 0, end: 1 },
			{ start: 2, end: 4 },
		]);
	});

	it("answers no stretch for no Workdays", () => {
		expect(workStretchesOf({ workdays: [] })).toEqual([]);
	});
});

describe("longestWorkStretch", () => {
	const workdays = [13, 14, 15, 16, 17, 20, 21, 22].map(january);

	it("counts the Workdays of the longest stretch", () => {
		expect(longestWorkStretch({ workdays, off: new Set() })).toBe(8);
	});

	it("splits a stretch at a day taken off", () => {
		expect(longestWorkStretch({ workdays, off: new Set([january(16)]) })).toBe(4);
	});

	it("answers nought when every Workday is off", () => {
		expect(longestWorkStretch({ workdays, off: new Set(workdays) })).toBe(0);
	});
});
