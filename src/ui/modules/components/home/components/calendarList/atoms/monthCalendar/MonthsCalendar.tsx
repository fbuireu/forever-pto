import { Chevron } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/chevron/Chevron";
import { Day } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/day/Day";
import { Dropdown } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/dropdown/Dropdown";
import { MonthSummary } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/monthSummary/MonthSummary";
import { Calendar } from "@ui/modules/components/core/calendar/Calendar";
import { Card } from "@ui/modules/components/core/card/Card";
import { getLocalizedDateFns } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { useLocale } from "next-intl";
import type { FocusEvent, MouseEvent, ReactNode } from "react";
import type { CalendarDay } from "react-day-picker";
import "./months-calendar.css";

interface MonthCalendarProps {
	month: Date;
	ptoDays: number;
	isPending: boolean;
	selectedDays: Date[];
	suggestedDays: Date[];
	hoveredBlockId: string | null;
	dayToBlockIdMap: Record<string, string>;
	isHoliday: (date: Date) => boolean;
	getHolidayName: (date: Date) => string | null;
	isDaySuggested: (date: Date) => boolean;
	isDayAlternative: (date: Date) => boolean;
	datePositionInBlock: (date: Date) => string | null;
	alternativeDayPosition: (date: Date) => string | null;
	handleDaySelect: (days: Date[] | undefined) => void;
	handleDayInteraction: (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => void;
	handleDayMouseOut: () => void;
	getMonthSummary: (month: Date) => ReactNode;
	isPastDaysAllowed: () => boolean;
}

const createDayComponent =
	(
		additionalProps: Omit<
			MonthCalendarProps,
			"month" | "ptoDays" | "isPending" | "suggestedDays" | "handleDaySelect" | "getMonthSummary"
		>,
	) =>
	({ day }: { day: CalendarDay }) => <Day day={day} {...additionalProps} />;

export const MonthCalendar = ({
	month,
	ptoDays,
	isPending,
	selectedDays,
	suggestedDays,
	hoveredBlockId,
	dayToBlockIdMap,
	isHoliday,
	getHolidayName,
	isDaySuggested,
	isDayAlternative,
	datePositionInBlock,
	alternativeDayPosition,
	handleDaySelect,
	handleDayInteraction,
	handleDayMouseOut,
	getMonthSummary,
	isPastDaysAllowed,
}: MonthCalendarProps) => {
	const locale = useLocale();
	return (
		<div className="mb-4">
			<Card key={month.toISOString()} className="flex mb-2 flex-col">
				{/* {isPending && <Spinner />} */}
				<Calendar
					mode="multiple"
					selected={selectedDays}
					onSelect={handleDaySelect}
					className="rounded-md"
					defaultMonth={month}
					month={month}
					weekStartsOn={1}
					fixedWeeks
					locale={getLocalizedDateFns(locale)}
					components={{
						Chevron,
						Dropdown,
						Day: createDayComponent({
							selectedDays,
							hoveredBlockId,
							dayToBlockIdMap,
							isHoliday,
							getHolidayName,
							isDaySuggested,
							isDayAlternative,
							datePositionInBlock,
							alternativeDayPosition,
							handleDayInteraction,
							handleDayMouseOut,
							isPastDaysAllowed,
						}),
					}}
				/>
			</Card>
			<MonthSummary ptoDays={ptoDays} suggestedDays={suggestedDays} monthSummary={getMonthSummary(month)} />
		</div>
	);
};
