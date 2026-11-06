import type { RawHoliday } from "@application/dto/holiday/types";
import { observedHolidays } from "./observedHolidays";
import type { HolidayLookup } from "./types";

interface LastLookup {
	key: string;
	raw: RawHoliday[];
}

let lastLookup: LastLookup | null = null;

export const cachedObservedHolidays = (lookup: HolidayLookup): RawHoliday[] => {
	const key = [lookup.country, lookup.region ?? "", lookup.year, lookup.locale].join("|");
	if (lastLookup?.key === key) return lastLookup.raw;

	const raw = observedHolidays(lookup);
	lastLookup = { key, raw };
	return raw;
};
