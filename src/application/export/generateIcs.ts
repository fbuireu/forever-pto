import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, toIcsDate } from '@application/shared/utils/dates';
import type { Suggestion } from '@domain/calendar/types';
import { sanitize } from './utils/sanitizer';

interface IcsEvent {
  uid: string;
  start: Date;
  summary: string;
  categories: string;
}

function buildEvent({ uid, start, summary, categories }: IcsEvent) {
  return [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${toIcsDate(start)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDays(start, 1))}`,
    `SUMMARY:${sanitize(summary)}`,
    `CATEGORIES:${categories}`,
    `UID:${uid}@forever-pto`,
    'END:VEVENT',
  ].join('\r\n');
}

export interface GenerateIcsOptions {
  year: number;
  calendarName: string;
  ptoDayLabel: string;
  holidays: HolidayDTO[];
  suggestion: Suggestion | null;
  includeHolidays: boolean;
  includePto: boolean;
}

export function generateIcs({
  year,
  calendarName,
  ptoDayLabel,
  holidays,
  suggestion,
  includeHolidays,
  includePto,
}: GenerateIcsOptions) {
  const events: string[] = [];

  if (includeHolidays) {
    for (const h of holidays) {
      events.push(buildEvent({ uid: `holiday-${h.id}`, start: h.date, summary: h.name, categories: 'HOLIDAY' }));
    }
  }

  if (includePto && suggestion) {
    for (const day of suggestion.days) {
      events.push(buildEvent({ uid: `pto-${toIcsDate(day)}`, start: day, summary: ptoDayLabel, categories: 'PTO' }));
    }
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forever PTO//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName} ${year}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
