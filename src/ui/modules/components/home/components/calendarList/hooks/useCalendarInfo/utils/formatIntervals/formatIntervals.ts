import type { IntervalInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { getLocalizedDateFns } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { format, getDate } from "date-fns";
import type { Locale, useTranslations } from "next-intl";

interface FormatIntervalsParams {
	intervals: IntervalInfo[];
	locale: Locale;
	t: ReturnType<typeof useTranslations>;
}

interface FormattedIntervalsReturn {
	text: string;
	totalDays: number;
}

export function formatIntervals({ intervals, locale, t }: FormatIntervalsParams): FormattedIntervalsReturn[] {
	const localizedDateFns = getLocalizedDateFns(locale);

	return intervals.map(({ interval, ptoDays, totalFreeDays }) => {
		const start = interval[0];
		const end = interval[interval.length - 1];
		const startDay = getDate(start);
		const month = format(start, "MMMM", { locale: localizedDateFns });

		let text: string;
		if (interval.length === 1) {
			text = t("intervals.singleDay", {
				day: startDay,
				month,
			});
		} else {
			text = t("intervals.multipleDay", {
				startDay,
				endDay: getDate(end),
				month,
				amount: ptoDays,
			});
		}

		return {
			text,
			totalDays: totalFreeDays,
		};
	});
}
