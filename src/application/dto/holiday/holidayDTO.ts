import type { HolidayDTO, RawHoliday } from '@application/dto/holiday/types';
import { getDateKey } from '@application/dto/holiday/utils/getDataKey';
import { getRegionName } from '@application/dto/holiday/utils/getRegionName';
import { isInTargetYear } from '@application/dto/holiday/utils/isInTargetYear';
import { shouldIncludeHoliday } from '@application/dto/holiday/utils/shouldIncludeHoliday';
import type { BaseDTO } from '@shared/application/dto/baseDTO';

type HolidayDTOConfiguration = {
	year: number;
	countryCode: string;
	monthsToShow: number;
};

export const holidayDTO: BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOConfiguration> = {
	create: ({ raw, configuration }) => {
		const { year, countryCode, monthsToShow } = configuration as HolidayDTOConfiguration;
		const targetYears = [year, year + 1];

		const nationalHolidays = raw
			.filter((holiday) => isInTargetYear({ holiday, targetYears }))
			.filter((holiday) => shouldIncludeHoliday({ holiday, monthsToShow: monthsToShow + 12, year }))
			.filter((holiday) => holiday.type === "public" && !holiday.location);

		const nationalDateSet = new Set(nationalHolidays.map((holiday) => getDateKey(new Date(holiday.date))));
		const regionalDateSet = new Set();

		const regionalHolidays = raw
			.filter((holiday) => isInTargetYear({ holiday, targetYears }))
			.filter((holiday) => shouldIncludeHoliday({ holiday, monthsToShow: monthsToShow + 12, year }))
			.filter((holiday) => holiday.type === "public" && holiday.location)
			.filter((holiday) => {
				const dateKey = getDateKey(new Date(holiday.date));

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
