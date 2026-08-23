import type { RawHoliday } from "@application/dto/holiday/types";
import type { HolidayLookup, HolidaySource } from "./types";
import { keepNonWorking, stampRegion } from "./utils/nonWorking";
import { resolveObservedHolidays } from "./utils/observed";

export interface ObservedHolidaysParams {
	source: HolidaySource;
	lookup: HolidayLookup;
}

export const observedHolidays = ({ source, lookup }: ObservedHolidaysParams): RawHoliday[] => {
	const { national, regional } = source.rawHolidays(lookup);
	const { region } = lookup;

	return resolveObservedHolidays({
		national: keepNonWorking(national),
		regional: region ? stampRegion({ raw: keepNonWorking(regional), region }) : [],
		hasRegion: Boolean(region),
	});
};
