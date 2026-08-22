import type { RawHoliday } from "@application/dto/holiday/types";
import type { HolidayLookup, HolidaySource } from "./types";
import { resolveObservedHolidays } from "./utils/observed";

interface FixtureCalendar {
	national?: RawHoliday[];
	regional?: Record<string, RawHoliday[]>;
	regions?: Record<string, Record<string, string>>;
}

export function createFixtureHolidaySource(calendar: FixtureCalendar): HolidaySource {
	return {
		observedHolidays: ({ region }: HolidayLookup) =>
			resolveObservedHolidays({
				national: calendar.national ?? [],
				regional: (region ? calendar.regional?.[region] : undefined) ?? [],
				hasRegion: Boolean(region),
			}),

		regionsOf: (country: string) => calendar.regions?.[country] ?? null,
	};
}
