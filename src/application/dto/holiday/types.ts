import type { HolidaysTypes } from 'date-holidays';

export interface RawHoliday extends HolidaysTypes.Holiday {
  location?: string;
}

export interface HolidayDTO {
  date: Date;
  name: string;
  type?: string;
  location?: string;
  variant: HolidayVariant;
}

export const enum HolidayVariant {
  NATIONAL = 'national',
  REGIONAL = 'regional',
  CUSTOM = 'custom',
}