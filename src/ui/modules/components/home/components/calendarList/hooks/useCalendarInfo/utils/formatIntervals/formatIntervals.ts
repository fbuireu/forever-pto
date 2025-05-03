import type { IntervalInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { getLocalizedDateFns } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { format, getDate } from "date-fns";
import type { Locale } from "next-intl";

export type FormattedIntervalsReturn = {
	text: string;
	totalDays: number;
};

export function formatIntervals(intervalsInfo: IntervalInfo[], locale: Locale): FormattedIntervalsReturn[] {
	return intervalsInfo.map(({ interval, ptoDays, totalFreeDays }) => {
		const start = interval[0];
		const end = interval[interval.length - 1];

		let text: string;
		if (interval.length === 1) {
			text = `${getDate(start)} de ${format(start, "MMMM", { locale: getLocalizedDateFns(locale) })}: 1 día.`;
		} else {
			text = `${getDate(start)} al ${getDate(end)} de ${format(start, "MMMM", { locale: getLocalizedDateFns(locale) })}: ${ptoDays} días.`;
		}

		return {
			text,
			totalDays: totalFreeDays,
		};
	});
}
