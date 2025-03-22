import type { HolidayDTO } from '@application/dto/holiday/types';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';

export function createHolidaysMap(holidays: HolidayDTO[]): Map<string, HolidayDTO> {
	const map = new Map<string, HolidayDTO>();

	for (const holiday of holidays) {
		const key = getDateKey(holiday.date);
		map.set(key, holiday);
	}

	return map;
}
