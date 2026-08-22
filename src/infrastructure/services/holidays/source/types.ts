import type { RawHoliday } from "@application/dto/holiday/types";

export interface HolidayLookup {
	country: string;
	region?: string;
	year: number;
	locale: string;
}

export interface HolidaySource {
	observedHolidays: (lookup: HolidayLookup) => RawHoliday[];
	regionsOf: (country: string) => Record<string, string> | null;
}
