import type { RawHoliday } from "@application/dto/holiday/types";
import { dateHolidaysSource } from "./dateHolidays";
import type { HolidayLookup } from "./types";
import { keepNonWorking, stampRegion } from "./utils/nonWorking";
import { resolveObservedHolidays } from "./utils/observed";

export const observedHolidays = (lookup: HolidayLookup): RawHoliday[] => {
	const { national, regional } = dateHolidaysSource.rawHolidays(lookup);
	const { region } = lookup;

	return resolveObservedHolidays({
		national: keepNonWorking(national),
		regional: region ? stampRegion({ raw: keepNonWorking(regional), region }) : [],
		hasRegion: Boolean(region),
	});
};
