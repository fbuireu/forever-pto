import type { HolidaysTypes } from 'date-holidays';

export interface RawHoliday extends HolidaysTypes.Holiday {
  location?: string;
}

export interface HolidayDTO {
  id: string;
  date: Date;
  name: string;
  type?: string;
  location?: string;
  variant: HolidayVariant;
}

export const HolidayVariant = {
  NATIONAL: 'national',
  REGIONAL: 'regional',
  CUSTOM: 'custom',
} as const;

export type HolidayVariant = (typeof HolidayVariant)[keyof typeof HolidayVariant];