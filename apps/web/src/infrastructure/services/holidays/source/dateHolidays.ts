import type { RawHoliday } from "@application/dto/holiday/types";
import Holidays from "date-holidays";
import type { HolidayLookup, HolidaySource } from "./types";

interface ForYearsParams {
	holidays: Holidays;
	year: number;
}

const forYears = ({ holidays, year }: ForYearsParams): RawHoliday[] => [
	...holidays.getHolidays(year),
	...holidays.getHolidays(year + 1),
];

export const dateHolidaysSource: HolidaySource = {
	rawHolidays: ({ country, region, year, locale }: HolidayLookup) => {
		const configuration = { languages: [locale] };

		return {
			national: forYears({ holidays: new Holidays(country, configuration), year }),
			regional: region ? forYears({ holidays: new Holidays(country, region, configuration), year }) : [],
		};
	},

	regionsOf: (country: string) => new Holidays(country).getStates(country.toLowerCase()) ?? null,
};
