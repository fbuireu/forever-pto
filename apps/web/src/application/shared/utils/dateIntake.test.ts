import { describe, expect, it } from "vitest";
import { fromStoredInstant, fromUpstreamCalendarDay } from "./dateIntake";

describe("fromStoredInstant", () => {
	it("passes a Date through untouched, because the instant is the thing being round-tripped", () => {
		const date = new Date(2024, 0, 1);
		expect(fromStoredInstant(date)).toBe(date);
	});

	it("revives an ISO string this app wrote", () => {
		const result = fromStoredInstant("2024-01-15T00:00:00.000Z");

		expect(result).toBeInstanceOf(Date);
		expect(result.getTime()).toBe(new Date("2024-01-15T00:00:00.000Z").getTime());
	});
});

describe("fromUpstreamCalendarDay", () => {
	it("reads the calendar day and returns it at local midnight", () => {
		const result = fromUpstreamCalendarDay("2027-03-09 00:00:00");

		expect(result.getFullYear()).toBe(2027);
		expect(result.getMonth()).toBe(2);
		expect(result.getDate()).toBe(9);
		expect(result.getHours()).toBe(0);
	});

	it("ignores a trailing UTC offset instead of shifting the day", () => {
		const withOffset = fromUpstreamCalendarDay("2027-03-09 00:00:00 -0600");

		expect(withOffset.getTime()).toBe(new Date(2027, 2, 9).getTime());
	});

	it("answers the same day for the same date whatever the offset says", () => {
		const bare = fromUpstreamCalendarDay("2027-03-09");
		const west = fromUpstreamCalendarDay("2027-03-09 00:00:00 -0600");
		const east = fromUpstreamCalendarDay("2027-03-09 00:00:00 +0900");

		expect(west.getTime()).toBe(bare.getTime());
		expect(east.getTime()).toBe(bare.getTime());
	});

	it("is not interchangeable with fromStoredInstant, which is why they are named apart", () => {
		const upstream = fromUpstreamCalendarDay("2027-03-09 00:00:00 -0600");
		const stored = fromStoredInstant("2027-03-09 00:00:00 -0600");

		expect(upstream.getTime()).not.toBe(stored.getTime());
	});
});
