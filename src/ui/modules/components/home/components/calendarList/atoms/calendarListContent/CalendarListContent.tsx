import { useEffectiveHolidays } from "@application/stores/holidays/holidaysStore";
import { useServerStore } from "@application/stores/server/serverStore";
import { getCountry } from "@infrastructure/services/country/getCountry/getCountry";
import { getRegion } from "@infrastructure/services/region/getRegion/getRegion";
import { MonthCalendar } from "@modules/components/home/components/calendarList/atoms/monthCalendar/MonthsCalendar";
import { useCalendarInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/useCalendarInfo";
import { useCalendarInteractions } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/useCalendarInteractions";
import { areArraysEqual } from "@modules/components/home/components/calendarList/utils/arrayIsEqual/arrayIsEqual";
import { Stats } from "@modules/components/home/components/stats/Stats";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";

interface CalendarListContentProps {
	calendar: any;
}

export const CalendarListContent = ({ calendar }: CalendarListContentProps) => {
	const t = useTranslations("calendarList");
	const effectiveHolidays = useEffectiveHolidays();
	const { ptoDays, country } = useServerStore();
	const [userCountry, setUserCountry] = useState<any>(null);
	const [userRegion, setUserRegion] = useState<string>("");

	// Load country and region data
	useEffect(() => {
		const loadData = async () => {
			if (country) {
				const countryData = await getCountry(country);
				const regionData = getRegion(effectiveHolidays);
				setUserCountry(countryData);
				setUserRegion(regionData || "");
			}
		};
		loadData();
	}, [country, effectiveHolidays]);

	const interactions = useCalendarInteractions({
		setHoveredBlockId: calendar.setHoveredBlockId,
		ptoDays: Number(ptoDays),
		isHoliday: calendar.isHoliday,
		isPastDaysAllowed: calendar.isPastDaysAllowed,
		alternativeBlocks: calendar.alternativeBlocks,
		dayToBlockIdMap: calendar.dayToBlockIdMap,
	});

	const calendarInfo = useCalendarInfo({
		suggestedDays: calendar.suggestedDays,
		dayToBlockIdMap: calendar.dayToBlockIdMap,
		hoveredBlockId: calendar.hoveredBlockId,
		alternativeBlocks: calendar.alternativeBlocks,
		ptoDays: Number(ptoDays),
		holidays: effectiveHolidays,
		calculateEffectiveDays: calendar.calculateEffectiveDays,
		isDaySuggested: interactions.isDaySuggested,
		t,
	});

	const calendarProps = {
		ptoDays: Number(ptoDays),
		...calendar,
		...interactions,
		...calendarInfo,
	};

	return (
		<div className="flex w-full flex-col items-center gap-8">
			<Stats stats={calendarInfo.stats} userCountry={userCountry} userRegion={userRegion} />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
				{calendar.monthsToShowDates.map((month: Date) => (
					<MemoizedMonthCalendar key={month.toISOString()} month={month} {...calendarProps} />
				))}
			</div>
		</div>
	);
};

const MemoizedMonthCalendar = memo(MonthCalendar, (prevProps, nextProps) => {
	return (
		prevProps.month.getTime() === nextProps.month.getTime() &&
		prevProps.ptoDays === nextProps.ptoDays &&
		prevProps.isPending === nextProps.isPending &&
		prevProps.hoveredBlockId === nextProps.hoveredBlockId &&
		areArraysEqual({ arr1: prevProps.selectedDays, arr2: nextProps.selectedDays })
	);
});
