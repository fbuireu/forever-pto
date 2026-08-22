import { describe, expect, it } from "vitest";
import { resolveSelectedDays } from "./selection";

const d = (iso: string) => new Date(iso);
const iso = (dates: Date[]) => dates.map((date) => date.toISOString().slice(0, 10));

describe("resolveSelectedDays", () => {
	it("returns the suggested days untouched when there are no manual changes", () => {
		const days = [d("2026-03-10"), d("2026-03-11")];
		expect(resolveSelectedDays({ days })).toBe(days);
	});

	it("drops days the user removed", () => {
		const days = [d("2026-03-10"), d("2026-03-11"), d("2026-03-12")];
		const result = resolveSelectedDays({ days, removedSuggestedDays: [d("2026-03-11")] });
		expect(iso(result)).toEqual(["2026-03-10", "2026-03-12"]);
	});

	it("adds days the user selected by hand", () => {
		const days = [d("2026-03-10")];
		const result = resolveSelectedDays({ days, manuallySelectedDays: [d("2026-07-01")] });
		expect(iso(result)).toEqual(["2026-03-10", "2026-07-01"]);
	});

	it("applies removals and additions together", () => {
		const days = [d("2026-03-10"), d("2026-03-11")];
		const result = resolveSelectedDays({
			days,
			manuallySelectedDays: [d("2026-01-05")],
			removedSuggestedDays: [d("2026-03-10")],
		});
		expect(iso(result)).toEqual(["2026-01-05", "2026-03-11"]);
	});

	it("returns the result in chronological order regardless of input order", () => {
		const result = resolveSelectedDays({
			days: [d("2026-06-01"), d("2026-02-01")],
			manuallySelectedDays: [d("2026-04-01")],
		});
		expect(iso(result)).toEqual(["2026-02-01", "2026-04-01", "2026-06-01"]);
	});

	it("matches removals by calendar day, not by timestamp", () => {
		const days = [new Date(2026, 2, 10, 9, 30)];
		const result = resolveSelectedDays({ days, removedSuggestedDays: [new Date(2026, 2, 10, 23, 59)] });
		expect(result).toEqual([]);
	});

	it("can empty the selection entirely", () => {
		const days = [d("2026-03-10")];
		expect(resolveSelectedDays({ days, removedSuggestedDays: [d("2026-03-10")] })).toEqual([]);
	});

	it("does not mutate the input array", () => {
		const days = [d("2026-03-10"), d("2026-03-11")];
		resolveSelectedDays({ days, removedSuggestedDays: [d("2026-03-10")] });
		expect(iso(days)).toEqual(["2026-03-10", "2026-03-11"]);
	});
});
