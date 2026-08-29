import type { HolidayDTO } from "@application/dto/holiday/types";
import { addDays } from "@application/shared/utils/dates";
import { contentLine } from "./utils/sanitizer";
import { toIcsDate, toIcsTimestamp } from "./utils/serializers";

interface IcsEvent {
	uid: string;
	stamp: string;
	start: Date;
	summary: string;
	categories: string;
}

const toUidToken = (value: string) => value.replace(/[^a-zA-Z0-9-]/g, "");

function buildEvent({ uid, stamp, start, summary, categories }: IcsEvent) {
	return [
		"BEGIN:VEVENT",
		contentLine({ name: "DTSTAMP", value: stamp }),
		contentLine({ name: "DTSTART;VALUE=DATE", value: toIcsDate(start) }),
		contentLine({ name: "DTEND;VALUE=DATE", value: toIcsDate(addDays({ date: start, days: 1 })) }),
		contentLine({ name: "SUMMARY", value: summary }),
		contentLine({ name: "CATEGORIES", value: categories }),
		contentLine({ name: "UID", value: `${uid}@forever-pto` }),
		"END:VEVENT",
	].join("\r\n");
}

export interface GenerateIcsOptions {
	year: number;
	calendarName: string;
	ptoDayLabel: string;
	holidays: HolidayDTO[];
	ptoDays: Date[];
	includeHolidays: boolean;
	includePto: boolean;
	country?: string;
	region?: string;
}

export function generateIcs({
	year,
	calendarName,
	ptoDayLabel,
	holidays,
	ptoDays,
	includeHolidays,
	includePto,
	country,
	region,
}: GenerateIcsOptions) {
	const events: string[] = [];
	const stamp = toIcsTimestamp(new Date());
	const scope = toUidToken([country, region].filter(Boolean).join("-")) || "unknown";

	if (includeHolidays) {
		for (const h of holidays) {
			events.push(
				buildEvent({
					uid: `holiday-${scope}-${toUidToken(h.id)}`,
					stamp,
					start: h.date,
					summary: h.name,
					categories: "HOLIDAY",
				}),
			);
		}
	}

	if (includePto) {
		for (const day of ptoDays) {
			events.push(
				buildEvent({
					uid: `pto-${scope}-${toIcsDate(day)}`,
					stamp,
					start: day,
					summary: ptoDayLabel,
					categories: "PTO",
				}),
			);
		}
	}

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Forever PTO//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		contentLine({ name: "X-WR-CALNAME", value: `${calendarName} ${year}` }),
		...events,
		"END:VCALENDAR",
	].join("\r\n");
}
