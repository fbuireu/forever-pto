import { EN, LOCALES } from "@infrastructure/i18n/locales";
import { getCountries } from "@infrastructure/services/countries/getCountries";
import { dateHolidaysSource } from "@infrastructure/services/holidays/source/dateHolidays";
import { observedHolidays } from "@infrastructure/services/holidays/source/observedHolidays";
import { describe, expect, it } from "vitest";
import { COUNTRY_COUNT } from "./shared";

const CALENDAR_YEAR = 2026;

const hasCalendar = (country: string) =>
	observedHolidays({ source: dateHolidaysSource, lookup: { country, year: CALENDAR_YEAR, locale: EN } }).length > 0;

describe("COUNTRY_COUNT", () => {
	it("is the number of Countries the selector offers that the Holiday source has a calendar for, so a library update that moves either list fails here", () => {
		const offered = getCountries(EN).map(({ value }) => value);
		const covered = offered.filter(hasCalendar);
		const uncovered = offered.filter((country) => !covered.includes(country));

		expect(covered).toEqual(expect.arrayContaining(["ES", "IT", "DE", "FR", "GB", "US"]));
		expect(uncovered.length).toBeGreaterThan(0);
		expect(uncovered.filter(hasCalendar)).toEqual([]);
		expect(COUNTRY_COUNT).toBe(covered.length);
	});

	it("counts the same Countries in every locale, since the selector names them in each", () => {
		const offeredIn = LOCALES.map((locale) =>
			getCountries(locale)
				.map(({ value }) => value)
				.toSorted(),
		);

		expect(offeredIn.length).toBe(LOCALES.length);
		expect(offeredIn.every((codes) => codes.join() === offeredIn[0]?.join())).toBe(true);
	});
});
