import type { RawHoliday } from "@application/dto/holiday/types";
import { observedHolidays } from "./observedHolidays";
import type { HolidayLookup, HolidaySource } from "./types";

interface LastLookup {
	key: string;
	source: HolidaySource;
	raw: RawHoliday[];
}

let lastLookup: LastLookup | null = null;

interface CachedObservedHolidaysParams {
	source: HolidaySource;
	lookup: HolidayLookup;
}

export const cachedObservedHolidays = ({ source, lookup }: CachedObservedHolidaysParams) => {
	const key = [lookup.country, lookup.region ?? "", lookup.year, lookup.locale].join("|");
	if (lastLookup?.key === key && lastLookup.source === source) return lastLookup.raw;

	const raw = observedHolidays({ source, lookup });
	lastLookup = { key, source, raw };
	return raw;
};
