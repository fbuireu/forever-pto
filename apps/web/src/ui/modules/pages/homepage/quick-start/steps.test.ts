import type { FiltersState } from "@application/stores/filters";
import { FilterStrategy } from "@domain/calendar/types";
import { describe, expect, it } from "vitest";
import { canLeaveStep, createDraft, QUICK_START_STEPS, QuickStartStep, trackedDraft, yearOptions } from "./steps";

const FILTERS: FiltersState = {
	ptoDays: 22,
	allowPastDays: false,
	country: "",
	region: "",
	year: 2026,
	carryOverMonths: 1,
	strategy: FilterStrategy.GROUPED,
	preferredMonths: [6, 7],
};

describe("QUICK_START_STEPS", () => {
	it("walks location, then the PTO Day budget, then the settings", () => {
		expect(QUICK_START_STEPS).toStrictEqual([
			QuickStartStep.LOCATION,
			QuickStartStep.PTO_DAYS,
			QuickStartStep.SETTINGS,
		]);
	});
});

describe("createDraft", () => {
	it("copies every planning input out of the filters store", () => {
		const filters = { ...FILTERS, country: "es", region: "ct", ptoDays: 30, strategy: FilterStrategy.BALANCED };

		expect(createDraft({ filters, detectedCountry: "fr" })).toStrictEqual(filters);
	});

	it("falls back to the country the edge detected when the store has none", () => {
		expect(createDraft({ filters: FILTERS, detectedCountry: "fr" }).country).toBe("fr");
	});

	it("leaves the country empty when neither the store nor the edge knows it", () => {
		expect(createDraft({ filters: FILTERS }).country).toBe("");
	});

	it("keeps the stored region only while the stored country is the one in the draft", () => {
		const filters = { ...FILTERS, region: "ct" };

		expect(createDraft({ filters, detectedCountry: "es" }).region).toBe("");
	});
});

describe("canLeaveStep", () => {
	it("holds the location step until a country is chosen", () => {
		expect(canLeaveStep({ step: QuickStartStep.LOCATION, draft: { country: "" } })).toBe(false);
		expect(canLeaveStep({ step: QuickStartStep.LOCATION, draft: { country: "es" } })).toBe(true);
	});

	it("never holds the other steps", () => {
		expect(canLeaveStep({ step: QuickStartStep.PTO_DAYS, draft: { country: "" } })).toBe(true);
		expect(canLeaveStep({ step: QuickStartStep.SETTINGS, draft: { country: "" } })).toBe(true);
	});
});

describe("yearOptions", () => {
	it("offers last year, this year and the two after it", () => {
		expect(yearOptions({ currentYear: 2026, selectedYear: 2026 })).toStrictEqual([2025, 2026, 2027, 2028]);
	});

	it("keeps a selected year outside that span rather than losing it", () => {
		expect(yearOptions({ currentYear: 2026, selectedYear: 2030 })).toStrictEqual([2025, 2026, 2027, 2028, 2030]);
		expect(yearOptions({ currentYear: 2026, selectedYear: 2020 })).toStrictEqual([2020, 2025, 2026, 2027, 2028]);
	});
});

describe("trackedDraft", () => {
	it("reports every planning input, the budget and the Region included", () => {
		const draft = { ...FILTERS, country: "es", region: "ct", ptoDays: 30, strategy: FilterStrategy.BALANCED };

		expect(trackedDraft(draft)).toStrictEqual({
			ptoDays: 30,
			country: "es",
			region: "ct",
			year: 2026,
			strategy: FilterStrategy.BALANCED,
			allowPastDays: false,
			carryOverMonths: 1,
		});
	});
});
