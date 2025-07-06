import { setDayClassName } from "@modules/components/home/components/calendarList/atoms/monthCalendar/utils/setDayClassName/setDayClassName";
import { format } from "date-fns";
import type { FocusEvent, MouseEvent } from "react";
import type { CalendarDay } from "react-day-picker";

interface DayProps {
	day: CalendarDay;
	selectedDays: Date[];
	hoveredBlockId: string | null;
	dayToBlockIdMap: Record<string, string>;
	isHoliday: (date: Date) => boolean;
	getHolidayName: (date: Date) => string | null;
	isDaySuggested: (date: Date) => boolean;
	isDayAlternative: (date: Date) => boolean;
	datePositionInBlock: (date: Date) => string | null;
	alternativeDayPosition: (date: Date) => string | null;
	handleDayInteraction: (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => void;
	handleDayMouseOut: () => void;
	isPastDaysAllowed: () => boolean;
}

export const Day = ({
	day,
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
}: DayProps) => {
	const { date, displayMonth } = day;
	const dayKey = format(date, "yyyy-MM-dd");
	const holiday = getHolidayName(date);
	const isSuggested = isDaySuggested(date);
	const isAlternative = isDayAlternative(date);
	const blockId = isSuggested ? dayToBlockIdMap[dayKey] || "" : "";
	const blockPosition = datePositionInBlock(date);
	const alternativePosition = alternativeDayPosition(date);

	const DATA_ATTRIBUTES = {
		"data-date": dayKey,
		...(isSuggested && { "data-suggested": true }),
		...(isAlternative && { "data-alternative": true }),
		...(isHoliday(date) && { "data-holiday": true }),
		...(blockId && { "data-block-id": blockId }),
		...(blockPosition && { "data-block-position": blockPosition }),
		...(alternativePosition && { "data-alternative-position": alternativePosition }),
		...(hoveredBlockId === blockId && { "data-hovered-block": true }),
	};

	return (
		<td className="p-0 relative">
			<button
				type="button"
				className={setDayClassName({
					date,
					displayMonth,
					selectedDays,
					isHoliday,
					isDaySuggested,
					isDayAlternative,
					isPastDaysAllowed,
				})}
				title={holiday ?? ""}
				onMouseOver={handleDayInteraction}
				onMouseOut={handleDayMouseOut}
				onBlur={handleDayMouseOut}
				onFocus={handleDayInteraction}
				{...DATA_ATTRIBUTES}
			>
				{date.getDate()}
			</button>
		</td>
	);
};
