import type { HolidayDTO } from "@application/dto/holiday/types";
import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type { BlockOpportunity } from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import { calculateEffectiveDays } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/calculateEffectiveDays/calculateEffectiveDays";
import { createYearMap } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/createYearMap/createYearMap";
import { findOptimalGaps } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/findOptimalGaps/findOptimalGaps";
import { generateInitialSelectedDays } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/generateInitialSelectedDays/generateInitialSelectedDays";
import { createAllCalendarMaps } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/optimizedMaps/optimizedMaps";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { addMonths, startOfMonth } from "date-fns";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState, useTransition } from "react";

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

	const calendarMaps = useMemo(
		() => createAllCalendarMaps(monthsToShowDates, holidays, selectedDays),
		[monthsToShowDates, holidays, selectedDays],
	);

	const getHolidayName = useCallback(
		(date: Date): string | null => {
			const holiday = calendarMaps.holidaysMap.get(getDateKey(date));
			return holiday?.name || null;
		},
		[calendarMaps.holidaysMap],
	);

	const isPastDayAllowed = useCallback(() => allowPastDays !== "false", [allowPastDays]);

	const calculateEffectiveDaysCallback = useCallback(
		(ptoDaysToEvaluate: Date[] = []): EffectiveRatio =>
			calculateEffectiveDays({
				freeDaysBaseMap: calendarMaps.freeDaysBaseMap,
				ptoDays: ptoDaysToEvaluate,
			}),
		[calendarMaps.freeDaysBaseMap],
	);

	const yearMap = useMemo(
		() =>
			createYearMap({
				monthsToShow: monthsToShowDates,
				isHoliday: calendarMaps.isHoliday,
				selectedPtoDays: [],
				isPastDayAllowed,
			}),
		[monthsToShowDates, calendarMaps.isHoliday, isPastDayAllowed],
	);

	useEffect(() => {
		const initialDays = generateInitialSelectedDays({ monthsToShow: monthsToShowDates, holidays });
		setSelectedDays(initialDays);
	}, [holidays, monthsToShowDates]);

	useEffect(() => {
		if (ptoDays <= 0) {
			setSuggestedDays([]);
			setAlternativeBlocks({});
			setDayToBlockIdMap({});
			return;
		}

		startTransition(() => {
			try {
				const { suggestedDays, alternativeBlocks, dayToBlockIdMap } = findOptimalGaps({
					yearMap,
					ptoDays,
					calculateEffectiveDays: calculateEffectiveDaysCallback,
				});
				setSuggestedDays(suggestedDays);
				setAlternativeBlocks(alternativeBlocks);
				setDayToBlockIdMap(dayToBlockIdMap);
			} catch (_) {
				setSuggestedDays([]);
				setAlternativeBlocks({});
				setDayToBlockIdMap({});
			}
		});
	}, [ptoDays, yearMap, calculateEffectiveDaysCallback]);

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
		freeDaysBaseMap: calendarMaps.freeDaysBaseMap,
		isHoliday: calendarMaps.isHoliday,
		getHolidayName,
		isPastDayAllowed,
		calculateEffectiveDays: calculateEffectiveDaysCallback,
	};
}
