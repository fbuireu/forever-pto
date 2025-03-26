import type { IntervalInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { format, getDate } from "date-fns";
import { es } from "date-fns/locale";

export type FormattedIntervalsReturn = {
	text: string;
	totalDays: number;
};

export function formatIntervals(intervalsInfo: IntervalInfo[]): FormattedIntervalsReturn[] {
	return intervalsInfo.map(({ interval, ptoDays, totalFreeDays }) => {
		const start = interval[0];
		const end = interval[interval.length - 1];

		let text: string;
		if (interval.length === 1) {
			text = `${getDate(start)} de ${format(start, "MMMM", { locale: es })}: 1 día.`;
		} else {
			text = `${getDate(start)} al ${getDate(end)} de ${format(start, "MMMM", { locale: es })}: ${ptoDays} días.`;
		}

		return {
			text,
			totalDays: totalFreeDays,
		};
	});
}
