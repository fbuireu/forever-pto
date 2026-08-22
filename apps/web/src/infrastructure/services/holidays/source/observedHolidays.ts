import type { RawHoliday } from "@application/dto/holiday/types";
import type { HolidayLookup, HolidaySource } from "./types";
import { keepNonWorking, stampRegion } from "./utils/nonWorking";
import { resolveObservedHolidays } from "./utils/observed";

export const observedHolidays = (source: HolidaySource, lookup: HolidayLookup): RawHoliday[] => {
	const { national, regional } = source.rawHolidays(lookup);
	const { region } = lookup;

	return resolveObservedHolidays({
		national: keepNonWorking(national),
		regional: region ? stampRegion(keepNonWorking(regional), region) : [],
		hasRegion: Boolean(region),
	});
};
