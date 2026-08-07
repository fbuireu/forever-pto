import type { HolidayDTO } from '@application/dto/holiday/types';
import { HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { generateIcs } from './generateIcs';

const makeHoliday = (overrides: Partial<HolidayDTO> = {}): HolidayDTO => ({
  id: 'h-1',
  date: new Date('2025-01-01'),
  name: 'New Year',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
  ...overrides,
});

const baseOptions = {
  year: 2025,
  calendarName: 'Forever PTO',
  ptoDayLabel: 'PTO Day',
  holidays: [] as HolidayDTO[],
  ptoDays: [] as Date[],
  includeHolidays: true,
  includePto: true,
};

describe('generateIcs', () => {
  describe('VCALENDAR envelope', () => {
    it('opens and closes VCALENDAR', () => {
      const result = generateIcs(baseOptions);
      expect(result).toMatch(/^BEGIN:VCALENDAR/);
      expect(result).toMatch(/END:VCALENDAR$/);
    });

    it('includes required calendar headers', () => {
      const result = generateIcs(baseOptions);
      expect(result).toContain('VERSION:2.0');
      expect(result).toContain('PRODID:-//Forever PTO//EN');
      expect(result).toContain('CALSCALE:GREGORIAN');
      expect(result).toContain('METHOD:PUBLISH');
    });

    it('includes calendar name with year', () => {
      const result = generateIcs({ ...baseOptions, calendarName: 'My Calendar', year: 2026 });
      expect(result).toContain('X-WR-CALNAME:My Calendar 2026');
    });
  });

  describe('holiday events', () => {
    it('includes a holiday event when includeHolidays is true', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ id: 'h-1', name: 'New Year', date: new Date('2025-01-01') })],
        includeHolidays: true,
      });
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('SUMMARY:New Year');
      expect(result).toContain('CATEGORIES:HOLIDAY');
      expect(result).toContain('UID:holiday-unknown-h-1@forever-pto');
    });

    it('excludes holiday events when includeHolidays is false', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday()],
        includeHolidays: false,
      });
      expect(result).not.toContain('BEGIN:VEVENT');
      expect(result).not.toContain('CATEGORIES:HOLIDAY');
    });

    it('includes multiple holidays', () => {
      const holidays = [
        makeHoliday({ id: 'h-1', name: 'New Year', date: new Date('2025-01-01') }),
        makeHoliday({ id: 'h-2', name: 'Easter', date: new Date('2025-04-20') }),
      ];
      const result = generateIcs({ ...baseOptions, holidays, includeHolidays: true });
      expect(result).toContain('UID:holiday-unknown-h-1@forever-pto');
      expect(result).toContain('UID:holiday-unknown-h-2@forever-pto');
    });
  });

  describe('PTO events', () => {
    it('includes PTO events when includePto is true and days are given', () => {
      const result = generateIcs({
        ...baseOptions,
        ptoDays: [new Date('2025-03-10')],
        includePto: true,
      });
      expect(result).toContain('SUMMARY:PTO Day');
      expect(result).toContain('CATEGORIES:PTO');
      expect(result).toContain('UID:pto-unknown-20250310@forever-pto');
    });

    it('excludes PTO events when includePto is false', () => {
      const result = generateIcs({
        ...baseOptions,
        ptoDays: [new Date('2025-03-10')],
        includePto: false,
      });
      expect(result).not.toContain('CATEGORIES:PTO');
    });

    it('excludes PTO events when there are no PTO days', () => {
      const result = generateIcs({ ...baseOptions, ptoDays: [], includePto: true });
      expect(result).not.toContain('CATEGORIES:PTO');
    });

    it('includes multiple PTO days', () => {
      const days = [new Date('2025-06-02'), new Date('2025-06-03'), new Date('2025-06-04')];
      const result = generateIcs({ ...baseOptions, ptoDays: days, includePto: true });
      expect(result).toContain('UID:pto-unknown-20250602@forever-pto');
      expect(result).toContain('UID:pto-unknown-20250603@forever-pto');
      expect(result).toContain('UID:pto-unknown-20250604@forever-pto');
    });
  });

  describe('date formatting', () => {
    it('formats DTSTART as VALUE=DATE:YYYYMMDD', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ date: new Date(2025, 6, 4) })],
        includeHolidays: true,
      });
      expect(result).toContain('DTSTART;VALUE=DATE:20250704');
    });

    it('sets DTEND to the day after DTSTART', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ date: new Date(2025, 6, 4) })],
        includeHolidays: true,
      });
      expect(result).toContain('DTEND;VALUE=DATE:20250705');
    });
  });

  describe('summary sanitization', () => {
    it('escapes semicolons in summary', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ name: 'A;B' })],
        includeHolidays: true,
      });
      expect(result).toContain('SUMMARY:A\\;B');
    });

    it('escapes commas in summary', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ name: 'A,B' })],
        includeHolidays: true,
      });
      expect(result).toContain('SUMMARY:A\\,B');
    });

    it('escapes backslashes in summary', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ name: 'A\\B' })],
        includeHolidays: true,
      });
      expect(result).toContain('SUMMARY:A\\\\B');
    });

    it('replaces newlines with \\n in summary', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ name: 'Line1\nLine2' })],
        includeHolidays: true,
      });
      expect(result).toContain('SUMMARY:Line1\\nLine2');
    });
  });

  describe('combined output', () => {
    it('produces both holiday and PTO events when both flags are true', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ id: 'h-1', name: 'New Year', date: new Date('2025-01-01') })],
        ptoDays: [new Date('2025-03-10')],
        includeHolidays: true,
        includePto: true,
      });
      expect(result).toContain('CATEGORIES:HOLIDAY');
      expect(result).toContain('CATEGORIES:PTO');
    });

    it('produces no events when both flags are false', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday()],
        ptoDays: [new Date('2025-03-10')],
        includeHolidays: false,
        includePto: false,
      });
      expect(result).not.toContain('BEGIN:VEVENT');
    });
  });

  describe('RFC 5545 required properties', () => {
    it('stamps every VEVENT with a UTC DTSTAMP', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday()],
        ptoDays: [new Date(2025, 2, 10)],
      });

      const events = result.split('BEGIN:VEVENT').slice(1);
      expect(events).toHaveLength(2);
      for (const event of events) {
        expect(event).toMatch(/\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/);
      }
    });
  });

  describe('UID uniqueness across calendars', () => {
    it('scopes a Holiday UID by Country and Region', () => {
      const spain = generateIcs({ ...baseOptions, holidays: [makeHoliday()], country: 'ES', region: 'CT' });
      const france = generateIcs({ ...baseOptions, holidays: [makeHoliday()], country: 'FR' });

      expect(spain).toContain('UID:holiday-ES-CT-h-1@forever-pto');
      expect(france).toContain('UID:holiday-FR-h-1@forever-pto');
    });

    it('scopes a PTO Day UID the same way, so two exports can coexist', () => {
      const spain = generateIcs({ ...baseOptions, ptoDays: [new Date(2025, 2, 10)], country: 'ES' });
      const france = generateIcs({ ...baseOptions, ptoDays: [new Date(2025, 2, 10)], country: 'FR' });

      expect(spain).toContain('UID:pto-ES-20250310@forever-pto');
      expect(france).toContain('UID:pto-FR-20250310@forever-pto');
    });

    it('strips characters a UID cannot carry out of the Holiday id', () => {
      const result = generateIcs({
        ...baseOptions,
        holidays: [makeHoliday({ id: 'national-2027-03-09 00:00:00 -0600' })],
        country: 'MY',
      });

      expect(result).toContain('UID:holiday-MY-national-2027-03-09000000-0600@forever-pto');
    });
  });
});
