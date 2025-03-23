import type { HolidayDTO } from '@application/dto/holiday/types';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import { calculateEffectiveDays } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/calculateEffectiveDays/calculateEffectiveDays';
import { createFreeDaysBaseMap } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createFreeDaysBaseMap/createFreeDaysBaseMap';
import { createHolidaysMap } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createHolidaysMap/createHolidaysMap';
import { createYearMap } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/createYearMap/createYearMap';
import { findOptimalGaps } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/findOptimalGaps/findOptimalGaps';
import { generateInitialSelectedDays } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/generateInitialSelectedDays/generateInitialSelectedDays';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { addMonths, startOfMonth } from 'date-fns';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState, useTransition } from 'react';

interface UseCalendarParams {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	holidays: HolidayDTO[];
	carryOverMonths: number;
}

interface UseCalendarReturn {
	selectedDays: Date[];
	setSelectedDays: Dispatch<SetStateAction<Date[]>>;
	suggestedDays: Date[];
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	dayToBlockIdMap: Record<string, string>;
	hoveredBlockId: string | null;
	setHoveredBlockId: Dispatch<SetStateAction<string | null>>;
	isPending: boolean;
	monthsToShowDates: Date[];
	freeDaysBaseMap: Map<string, Date>;
	isHoliday: (date: Date) => boolean;
	getHolidayName: (date: Date) => string | null;
	isPastDayAllowed: () => boolean;
	calculateEffectiveDays: (ptoDaysToAdd: Date[]) => EffectiveRatio;
}

export function useCalendar({
	year,
	ptoDays,
	allowPastDays,
	holidays,
	carryOverMonths,
}: UseCalendarParams): UseCalendarReturn {
	const [selectedDays, setSelectedDays] = useState<UseCalendarReturn["selectedDays"]>([]);
	const [suggestedDays, setSuggestedDays] = useState<UseCalendarReturn["suggestedDays"]>([]);
	const [alternativeBlocks, setAlternativeBlocks] = useState<UseCalendarReturn["alternativeBlocks"]>({});
	const [dayToBlockIdMap, setDayToBlockIdMap] = useState<UseCalendarReturn["dayToBlockIdMap"]>({});
	const [hoveredBlockId, setHoveredBlockId] = useState<UseCalendarReturn["hoveredBlockId"]>(null);
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

	const isPastDayAllowed = useCallback(() => allowPastDays !== "false", [allowPastDays]);

	useEffect(() => {
		const initialDays = generateInitialSelectedDays({ monthsToShow: monthsToShowDates, holidays });
		setSelectedDays(initialDays);
	}, [holidays, monthsToShowDates]);

	const freeDaysBaseMap = useMemo(
		() =>
			createFreeDaysBaseMap({
				monthsToShow: monthsToShowDates,
				holidays,
				selectedPtoDays: selectedDays,
			}),
		[monthsToShowDates, holidays, selectedDays],
	);

	const calculateEffectiveDaysCallback = useCallback(
		(ptoDaysToEvaluate: Date[] = []): EffectiveRatio =>
			calculateEffectiveDays({
				freeDaysBaseMap,
				ptoDays: ptoDaysToEvaluate,
			}),
		[freeDaysBaseMap],
	);

	const yearMap = useMemo(
		() =>
			createYearMap({
				monthsToShow: monthsToShowDates,
				isHoliday,
				selectedDays,
				selectedPtoDays: [],
				isPastDayAllowed,
			}),
		[monthsToShowDates, isHoliday, selectedDays, isPastDayAllowed],
	);

	const findOptimalGapsCallback = useCallback(
		() =>
			findOptimalGaps({
				yearMap,
				ptoDays,
				calculateEffectiveDays: calculateEffectiveDaysCallback,
			}),
		[yearMap, ptoDays, calculateEffectiveDaysCallback],
	);

	useEffect(() => {
		if (ptoDays <= 0) {
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
	}, [ptoDays, findOptimalGapsCallback]);

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
		freeDaysBaseMap,
		isHoliday,
		getHolidayName,
		isPastDayAllowed,
		calculateEffectiveDays: calculateEffectiveDaysCallback,
	};
}
