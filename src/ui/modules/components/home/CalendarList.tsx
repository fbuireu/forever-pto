"use client";

import type { HolidayDTO } from '@application/dto/holiday/types';
import { MonthCalendar } from '@modules/components/home/atoms/MonthsCalendar';
import { usePTOCalculator } from '@modules/components/home/hooks/usePtoCalculator';
import React, { memo } from 'react';
import { areArraysEqual } from '@modules/components/home/utils/arrayIsEqual';

interface CalendarListProps {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	holidays: HolidayDTO[];
	carryOverMonths: number;
}


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