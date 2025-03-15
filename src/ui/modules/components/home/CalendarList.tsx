"use client";

import type { HolidayDTO } from '@application/dto/holiday/types';
import { MonthCalendar } from '@modules/components/home/MonthsCalendar';
import { usePTOCalculator } from '@modules/components/home/hooks/usePtoCalculator';
import { getDateKey } from '@modules/components/home/utils/day';
import React, { memo } from 'react';

interface CalendarListProps {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	holidays: HolidayDTO[];
	carryOverMonths: number;
}

function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getDate() === date2.getDate() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getFullYear() === date2.getFullYear()
	);
}

function areArraysEqual(arr1: Date[], arr2: Date[]): boolean {
	if (arr1.length !== arr2.length) return false;

	// Para arrays pequeños, es más eficiente hacer una comparación directa
	if (arr1.length < 10) {
		return arr1.every((date1) => arr2.some((date2) => isSameDay(date1, date2)));
	}

	// Para arrays más grandes, usar un Set para optimizar
	const set = new Set<string>();
	arr1.forEach((date) => set.add(getDateKey(date)));

	return arr2.every((date) => set.has(getDateKey(date)));
}

const MemoizedMonthCalendar = memo(MonthCalendar, (prevProps, nextProps) => {
	return (
		prevProps.month.getTime() === nextProps.month.getTime() &&
		prevProps.ptoDays === nextProps.ptoDays &&
		prevProps.isPending === nextProps.isPending &&
		prevProps.hoveredBlockId === nextProps.hoveredBlockId &&
		areArraysEqual(prevProps.selectedDays, nextProps.selectedDays) &&
		areArraysEqual(
			prevProps.getSuggestedDaysForMonth(prevProps.month),
			nextProps.getSuggestedDaysForMonth(nextProps.month),
		)
	);
});

MemoizedMonthCalendar.displayName = "MemoizedMonthCalendar";

export default function CalendarList({ year, ptoDays, allowPastDays, holidays, carryOverMonths }: CalendarListProps) {
	const {
		selectedDays,
		suggestedDays,
		dayToBlockIdMap,
		hoveredBlockId,
		isPending,
		monthsToShowDates,
		isHoliday,
		getHolidayName,
		isPastDayAllowed,
		isDaySuggested,
		isDayAlternative,
		getDayPositionInBlock,
		getAlternativeDayPosition,
		getSuggestedDaysForMonth,
		getMonthSummary,
		handleDaySelect,
		handleDayInteraction,
		handleDayMouseOut,
	} = usePTOCalculator({
		year,
		ptoDays,
		allowPastDays,
		holidays,
		carryOverMonths,
	});

	return (
		<section className="flex w-full flex-col items-center gap-8">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
				{monthsToShowDates.map((month) => (
					<MemoizedMonthCalendar
						key={month.toISOString()}
						month={month}
						ptoDays={ptoDays}
						isPending={isPending}
						selectedDays={selectedDays}
						suggestedDays={suggestedDays}
						hoveredBlockId={hoveredBlockId}
						dayToBlockIdMap={dayToBlockIdMap}
						isHoliday={isHoliday}
						getHolidayName={getHolidayName}
						isDaySuggested={isDaySuggested}
						isDayAlternative={isDayAlternative}
						getDayPositionInBlock={getDayPositionInBlock}
						getAlternativeDayPosition={getAlternativeDayPosition}
						handleDaySelect={handleDaySelect}
						handleDayInteraction={handleDayInteraction}
						handleDayMouseOut={handleDayMouseOut}
						getSuggestedDaysForMonth={getSuggestedDaysForMonth}
						getMonthSummary={getMonthSummary}
						isPastDayAllowed={isPastDayAllowed}
					/>
				))}
			</div>
		</section>
	);
}
