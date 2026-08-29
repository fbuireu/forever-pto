import type { RawHoliday } from "@application/dto/holiday/types";

export interface HolidayLookup {
	country: string;
	region?: string;
	year: number;
	locale: string;
}

export interface RawLookupResult {
	national: RawHoliday[];
	regional: RawHoliday[];
}

export interface HolidaySource {
	rawHolidays: (lookup: HolidayLookup) => RawLookupResult;
	regionsOf: (country: string) => Record<string, string> | null;
}
