import type { HolidayDTO, RawHoliday } from "@application/dto/holiday/types";
import { getDTODateKey } from "@application/dto/holiday/utils/getDTODateKey/getDTODateKey";
import { getRegionName } from "@application/dto/holiday/utils/getRegionName/getRegionName";
import { isInTargetYear } from "@application/dto/holiday/utils/isInTargetYear/isInTargetYear";
import { shouldIncludeHoliday } from "@application/dto/holiday/utils/shouldIncludeHoliday/shouldIncludeHoliday";
import type { BaseDTO } from "@shared/application/dto/baseDTO";

type HolidayDTOConfiguration = {
	year: number;
	countryCode: string;
	carryOverMonths: number;
};

export const holidayDTO: BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOConfiguration> = {
	create: ({ raw, configuration }) => {
		const { year, countryCode, carryOverMonths } = configuration as HolidayDTOConfiguration;
		const targetYears = [year, year + 1];

		const nationalHolidays = raw
			.filter((holiday) => isInTargetYear({ holiday, targetYears }))
			.filter((holiday) => shouldIncludeHoliday({ holiday, carryOverMonths: carryOverMonths + 12, year }))
			.filter((holiday) => holiday.type === "public" && !holiday.location);

		const nationalDateSet = new Set(nationalHolidays.map((holiday) => getDTODateKey(new Date(holiday.date))));
		const regionalDateSet = new Set();

		const regionalHolidays = raw
			.filter((holiday) => isInTargetYear({ holiday, targetYears }))
			.filter((holiday) => shouldIncludeHoliday({ holiday, carryOverMonths: carryOverMonths + 12, year }))
			.filter((holiday) => holiday.type === "public" && holiday.location)
			.filter((holiday) => {
				const dateKey = getDTODateKey(new Date(holiday.date));

				if (nationalDateSet.has(dateKey) || regionalDateSet.has(dateKey)) {
					return false;
				}

				regionalDateSet.add(dateKey);
				return true;
			});

		return [...nationalHolidays, ...regionalHolidays]
			.map((holiday) => ({
				date: new Date(holiday.date),
				name: holiday.name,
				type: holiday.type,
				...(holiday.location && {
					location: getRegionName({
						countryCode,
						regionCode: holiday.location,
					}),
				}),
			}))
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	},
};
