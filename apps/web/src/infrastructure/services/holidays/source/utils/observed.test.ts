import type { RawHoliday } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import { resolveObservedHolidays } from "./observed";

interface RawParams {
	date: string;
	name: string;
	location?: string;
}

const raw = ({ date, name, location }: RawParams) => ({ date, name, type: "public", location }) as RawHoliday;

const NEW_YEAR = raw({ date: "2027-01-01 00:00:00", name: "New Year" });
const COLUMBUS = raw({ date: "2027-10-11 00:00:00", name: "Columbus Day" });
const NEW_YEAR_CA = raw({ date: "2027-01-01 00:00:00", name: "New Year", location: "CA" });
const CHAVEZ_CA = raw({ date: "2027-03-31 00:00:00", name: "Cesar Chavez Day", location: "CA" });

describe("resolveObservedHolidays", () => {
	it("keeps every National Holiday when no Region is chosen", () => {
		const observed = resolveObservedHolidays({ national: [NEW_YEAR, COLUMBUS], regional: [], hasRegion: false });

		expect(observed.map(({ name }) => name)).toEqual(["New Year", "Columbus Day"]);
	});

	it("drops a National Holiday the Region does not observe", () => {
		const observed = resolveObservedHolidays({
			national: [NEW_YEAR, COLUMBUS],
			regional: [NEW_YEAR_CA, CHAVEZ_CA],
			hasRegion: true,
		});

		expect(observed.map(({ name }) => name)).not.toContain("Columbus Day");
	});

	it("keeps the Regional entries the Region adds", () => {
		const observed = resolveObservedHolidays({
			national: [NEW_YEAR, COLUMBUS],
			regional: [NEW_YEAR_CA, CHAVEZ_CA],
			hasRegion: true,
		});

		expect(observed.map(({ name }) => name)).toContain("Cesar Chavez Day");
	});

	it("puts National entries first, which is what lets the mapper resolve a shared date", () => {
		const observed = resolveObservedHolidays({
			national: [NEW_YEAR, COLUMBUS],
			regional: [NEW_YEAR_CA, CHAVEZ_CA],
			hasRegion: true,
		});

		expect(observed[0]).toBe(NEW_YEAR);
	});

	it("empties the calendar when a Region observes nothing at all, rather than falling back to the Country", () => {
		const observed = resolveObservedHolidays({ national: [NEW_YEAR, COLUMBUS], regional: [], hasRegion: true });

		expect(observed).toEqual([]);
	});
});
