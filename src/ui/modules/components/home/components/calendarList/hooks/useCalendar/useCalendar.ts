import type { HolidayDTO } from '@application/dto/holiday/types';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import {
	calculateEffectiveDays,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/calculateEffectiveDays/calculateEffectiveDays';
import {
	createFreeDaysBaseMap,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createFreeDaysBaseMap/createFreeDaysBaseMap';
import {
	createHolidaysMap,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createHolidaysMap/createHolidaysMap';
import {
	createYearMap,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createYearMap/createYearMap';
import {
	findOptimalGaps,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/findOptimalGaps/findOptimalGaps';
import {
	generateInitialSelectedDays,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/generateInitialSelectedDays/generateInitialSelectedDays';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { addMonths, isWeekend, startOfMonth } from 'date-fns';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

interface UseCalendarParams {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	holidays: HolidayDTO[];
	carryOverMonths: number;
}

export function useCalendar({ year, ptoDays, allowPastDays, holidays, carryOverMonths }: UseCalendarParams) {
	const [selectedDays, setSelectedDays] = useState<Date[]>([]);
	const [suggestedDays, setSuggestedDays] = useState<Date[]>([]);
	const [alternativeBlocks, setAlternativeBlocks] = useState<Record<string, BlockOpportunity[]>>({});
	const [dayToBlockIdMap, setDayToBlockIdMap] = useState<Record<string, string>>({});
	const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const monthsToShowDates = useMemo(() => {
		const start = startOfMonth(new Date(year, 0, 1));
		const totalMonths = carryOverMonths + 12;
		return Array.from({ length: totalMonths }, (_, i) => addMonths(start, i));
	}, [year, carryOverMonths]);

	const holidaysMap = useMemo(() => createHolidaysMap(holidays), [holidays]);

	const isHoliday = useCallback((date: Date): boolean => holidaysMap.has(getDateKey(date)), [holidaysMap]);

	const getHolidayName = useCallback(
		(date: Date): string | null => {
			const holiday = holidaysMap.get(getDateKey(date));
			return holiday ? holiday.name : null;
		},
		[holidaysMap],
	);

	const isPastDayAllowed = useCallback(() => {
		return !(allowPastDays === "false");
	}, [allowPastDays]);

	useEffect(() => {
		const initialDays = generateInitialSelectedDays({ monthsToShow: monthsToShowDates, holidays });
		setSelectedDays(initialDays);
	}, [holidays, monthsToShowDates]);

	const selectedPtoDays = useMemo(() => {
		return selectedDays.filter((day) => !isWeekend(day) && !isHoliday(day));
	}, [selectedDays, isHoliday]);

	const freeDaysBaseMap = useMemo(
		() => createFreeDaysBaseMap({ monthsToShow: monthsToShowDates, holidays, selectedPtoDays: selectedDays }),
		[monthsToShowDates, holidays, selectedDays],
	);

	const calculateEffectiveDaysCallback = useCallback(
		(ptoDaysToAdd: Date[] = []): EffectiveRatio => {
			return calculateEffectiveDays({ freeDaysBaseMap, selectedPtoDays, ptoDaysToAdd });
		},
		[freeDaysBaseMap, selectedPtoDays],
	);

	const yearMap = useMemo(
		() =>
			createYearMap({ monthsToShow: monthsToShowDates, isHoliday, selectedDays, selectedPtoDays, isPastDayAllowed }),
		[monthsToShowDates, isHoliday, selectedDays, selectedPtoDays, isPastDayAllowed],
	);

	const findOptimalGapsCallback = useCallback(
		() =>
			findOptimalGaps({
				yearMap,
				ptoDays,
				selectedPtoDaysLength: selectedPtoDays.length,
				calculateEffectiveDays: calculateEffectiveDaysCallback,
			}),
		[yearMap, ptoDays, selectedPtoDays.length, calculateEffectiveDaysCallback],
	);

	useEffect(() => {
		const remainingDays = ptoDays - selectedPtoDays.length;

		if (remainingDays <= 0 || ptoDays <= 0) {
			setSuggestedDays([]);
			setAlternativeBlocks({});
			setDayToBlockIdMap({});
			return;
		}

		startTransition(() => {
			try {
				const result = findOptimalGapsCallback();
				setSuggestedDays(result.suggestedDays);
				setAlternativeBlocks(result.alternativeBlocks);
				setDayToBlockIdMap(result.dayToBlockIdMap);
			} catch (error) {
				setSuggestedDays([]);
				setAlternativeBlocks({});
				setDayToBlockIdMap({});
			}
		});
	}, [ptoDays, selectedPtoDays.length, findOptimalGapsCallback]);

	return {
		selectedDays,
		setSelectedDays,
		suggestedDays,
		alternativeBlocks,
		dayToBlockIdMap,
		hoveredBlockId,
		setHoveredBlockId,
		isPending,
		monthsToShowDates,
		selectedPtoDays,
		freeDaysBaseMap,
		isHoliday,
		getHolidayName,
		isPastDayAllowed,
		calculateEffectiveDays: calculateEffectiveDaysCallback,
	};
}
