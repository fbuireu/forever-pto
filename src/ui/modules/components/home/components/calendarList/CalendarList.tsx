"use client";

import { useEffectiveHolidays } from "@application/stores/holidays/holidaysStore";
import { useServerStore } from "@application/stores/server/serverStore";
import { useCalendar } from "@ui/modules/components/home/components/calendarList/hooks/useCalendar/useCalendar";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { CalendarListContent } from "./atoms/calendarListContent/CalendarListContent";

export default function CalendarList() {
	const t = useTranslations("calendarList");
	const effectiveHolidays = useEffectiveHolidays();

	// Read from server store (URL params only)
	const { year, ptoDays, allowPastDays, carryOverMonths } = useServerStore();

	const calendar = useCalendar({
		year: Number(year),
		ptoDays: Number(ptoDays),
		allowPastDays,
		holidays: effectiveHolidays,
		carryOverMonths: Number(carryOverMonths),
	});

	return (
		<section className="space-y-4">
			<CalendarListContent calendar={calendar} />
		</section>
	);
}
