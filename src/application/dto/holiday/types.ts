import type { HolidaysTypes } from 'date-holidays';

export interface RawHoliday extends HolidaysTypes.Holiday {
  location?: string;
}
