import type { HolidayDTO } from '@application/dto/holiday/types';

export function getRegion(holidays: HolidayDTO[]): string | undefined {
	try {
		return holidays.find((holiday) => holiday.location)?.location;
	} catch (error) {
		return undefined;
	}
}
