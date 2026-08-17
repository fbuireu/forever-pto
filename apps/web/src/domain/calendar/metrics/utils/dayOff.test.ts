import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { dayKey, dayOffKeys } from './dayOff';

const holiday = (date: Date): HolidayDTO => ({
  id: date.toISOString(),
  date,
  name: 'Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

describe('dayOffKeys', () => {
  it('unions the placed days with the Holidays', () => {
    const placed = new Date(2026, 0, 6);
    const free = new Date(2026, 0, 1);

    const keys = dayOffKeys({ placedDays: [placed], holidays: [holiday(free)] });

    expect(keys).toEqual(new Set([dayKey(placed), dayKey(free)]));
  });

  it('counts a day the plan placed on a Holiday once, which is what a Set is here for', () => {
    const shared = new Date(2026, 0, 1);

    expect(dayOffKeys({ placedDays: [shared], holidays: [holiday(shared)] }).size).toBe(1);
  });

  it('matches two Dates for the same day whatever time of day they carry', () => {
    const midnight = new Date(2026, 0, 6);
    const noon = new Date(2026, 0, 6, 12, 30);

    expect(dayOffKeys({ placedDays: [midnight], holidays: [holiday(noon)] }).size).toBe(1);
  });

  it('answers an empty set for an empty plan and no Holidays', () => {
    expect(dayOffKeys({ placedDays: [], holidays: [] })).toEqual(new Set());
  });
});
