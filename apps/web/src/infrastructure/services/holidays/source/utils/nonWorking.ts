import type { RawHoliday } from '@application/dto/holiday/types';
import type { HolidaysTypes } from 'date-holidays';

const NON_WORKING_TYPES = new Set<HolidaysTypes.HolidayType>(['public', 'bank']);

export const keepNonWorking = (raw: RawHoliday[]): RawHoliday[] =>
  raw.filter(({ type }) => NON_WORKING_TYPES.has(type));

export const stampRegion = (raw: RawHoliday[], region: string): RawHoliday[] =>
  raw.map((holiday) => ({ ...holiday, location: region }));
