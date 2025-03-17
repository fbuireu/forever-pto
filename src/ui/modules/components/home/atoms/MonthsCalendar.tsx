import { Calendar } from '@modules/components/core/Calendar';
import { Card } from '@modules/components/core/Card';
import { LoadingSpinner } from '@modules/components/core/Spinner';
import { getDayClassName } from '@modules/components/home/utils/day';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
	getDayPositionInBlock: (date: Date) => string | null;
	getAlternativeDayPosition: (date: Date) => string | null;
	handleDaySelect: (days: Date[] | undefined) => void;
	handleDayInteraction: (e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>) => void;
	handleDayMouseOut: () => void;
	getSuggestedDaysForMonth: (month: Date) => Date[];
	getMonthSummary: (month: Date) => React.ReactNode;
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
	getDayPositionInBlock,
	getAlternativeDayPosition,
	handleDaySelect,
	handleDayInteraction,
	handleDayMouseOut,
	getSuggestedDaysForMonth,
	getMonthSummary,
	isPastDayAllowed,
}: MonthCalendarProps) => {
	return (
		<Card key={month.toISOString()} className="mb-4 flex flex-col">
			{isPending && <LoadingSpinner />}
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
						const holiday = getHolidayName(date);
						const dateKey = format(date, "yyyy-MM-dd");
						const isSuggested = isDaySuggested(date);
						const isAlternative = isDayAlternative(date);
						const blockId = isSuggested ? dayToBlockIdMap[dateKey] || "" : "";
						const blockPosition = getDayPositionInBlock(date);
						const alternativePosition = getAlternativeDayPosition(date);

						return (
							<td className="p-0 relative">
								<button
									type="button"
									className={getDayClassName({
										date,
										displayMonth,
										selectedDays,
										isHoliday,
										isDaySuggested,
										isDayAlternative,
										isPastDayAllowed,
									})}
									title={holiday || ""}
									data-suggested={isSuggested ? "true" : "false"}
									data-alternative={isAlternative ? "true" : "false"}
									data-block-id={blockId}
									data-block-position={blockPosition || ""}
									data-alternative-position={alternativePosition || ""}
									data-hovered-block={hoveredBlockId === blockId ? "true" : ""}
									data-date={dateKey}
									onMouseOver={handleDayInteraction}
									onMouseOut={handleDayMouseOut}
									onBlur={handleDayMouseOut}
									onFocus={handleDayInteraction}
								>
									{date.getDate()}
								</button>
							</td>
						);
					},
				}}
			/>
			{ptoDays > 0 && suggestedDays.length > 0 && getSuggestedDaysForMonth(month).length > 0 && (
				<div>
					{getMonthSummary(month) && (
						<div className="mt-2 rounded-md border border-primary/20 bg-primary/10 p-2 text-xs text-primary-foreground/90">
							<p className="mb-1 font-semibold">Sugerencia:</p>
							{getMonthSummary(month)}
							<div className="mt-2 text-xs text-muted-foreground">
								<p>
									Pasa el cursor sobre un día sugerido <br /> para ver alternativas similares.
								</p>
							</div>
						</div>
					)}
				</div>
			)}
		</Card>
	);
};
