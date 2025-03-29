import { setDayClassName } from "@modules/components/home/utils/setDayClassName";
import { Calendar } from "@ui/modules/components/core/calendar/Calendar";
import { Card } from "@ui/modules/components/core/card/Card";
import { Spinner } from "@ui/modules/components/core/spinner/Spinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { FocusEvent, MouseEvent, ReactNode } from "react";
import "./months-calendar.css";
import { MonthSummary } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/monthSummary/MonthSummary";

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
	isPastDayAllowed: () => boolean;
}

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
	isPastDayAllowed,
}: MonthCalendarProps) => {
	return (
		<div className="mb-4">
			<Card key={month.toISOString()} className="flex mb-2 flex-col">
				{isPending && <Spinner />}
				<Calendar
					mode="multiple"
					selected={selectedDays}
					onSelect={handleDaySelect}
					className="rounded-md border"
					defaultMonth={month}
					month={month}
					weekStartsOn={1}
					fixedWeeks
					locale={es}
					components={{
						Chevron: () => <></>,
						Dropdown: () => <></>,
						Day: ({ day }) => {
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
											isPastDayAllowed,
										})}
										title={holiday || ""}
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
						},
					}}
				/>
			</Card>
			<MonthSummary ptoDays={ptoDays} suggestedDays={suggestedDays} monthSummary={getMonthSummary(month)} />
		</div>
	);
};
