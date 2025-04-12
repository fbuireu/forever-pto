"use client";

import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { MonthCalendar } from "@modules/components/home/components/calendarList/atoms/monthCalendar/MonthsCalendar";
import { useCalendar } from "@modules/components/home/components/calendarList/hooks/useCalendar/useCalendar";
import { useCalendarInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/useCalendarInfo";
import { useCalendarInteractions } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/useCalendarInteractions";
import { Stats } from "@modules/components/home/components/stats/Stats";
import { areArraysEqual } from "@modules/components/home/utils/arrayIsEqual";
import { memo } from "react";

interface CalendarListProps {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	carryOverMonths: number;
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
}

export default function CalendarList({
	year,
	ptoDays,
	allowPastDays,
	carryOverMonths,
	userCountry,
	userRegion,
}: CalendarListProps) {
	const effectiveHolidays = useHolidaysStore((state) => state.effectiveHolidays);

	const calendar = useCalendar({
		year,
		ptoDays,
		allowPastDays,
		holidays: effectiveHolidays,
		carryOverMonths,
	});

	const interactions = useCalendarInteractions({
		selectedDays: calendar.selectedDays,
		setSelectedDays: calendar.setSelectedDays,
		setHoveredBlockId: calendar.setHoveredBlockId,
		ptoDays,
		isHoliday: calendar.isHoliday,
		isPastDayAllowed: calendar.isPastDayAllowed,
		alternativeBlocks: calendar.alternativeBlocks,
		dayToBlockIdMap: calendar.dayToBlockIdMap,
	});

	const calendarInfo = useCalendarInfo({
		suggestedDays: calendar.suggestedDays,
		dayToBlockIdMap: calendar.dayToBlockIdMap,
		hoveredBlockId: calendar.hoveredBlockId,
		alternativeBlocks: calendar.alternativeBlocks,
		ptoDays,
		holidays: effectiveHolidays,
		calculateEffectiveDays: calendar.calculateEffectiveDays,
		isDaySuggested: interactions.isDaySuggested,
	});

	const calendarProps = {
		ptoDays,
		...calendar,
		...interactions,
		...calendarInfo,
	};

	return (
		<section className="flex w-full flex-col items-center gap-8">
			<Stats stats={calendarInfo.stats} userCountry={userCountry} userRegion={userRegion} />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
				{calendar.monthsToShowDates.map((month) => (
					<MemoizedMonthCalendar key={month.toISOString()} month={month} {...calendarProps} />
				))}
			</div>
		</section>
	);
}

const MemoizedMonthCalendar = memo(MonthCalendar, (prevProps, nextProps) => {
	return (
		prevProps.month.getTime() === nextProps.month.getTime() &&
		prevProps.ptoDays === nextProps.ptoDays &&
		prevProps.isPending === nextProps.isPending &&
		prevProps.hoveredBlockId === nextProps.hoveredBlockId &&
		areArraysEqual(prevProps.selectedDays, nextProps.selectedDays)
	);
});
