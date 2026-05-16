import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { FilterStrategy } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { generateSuggestions } from './generateSuggestions';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

const BASE = {
  year: 2025,
  holidays: [] as ReturnType<typeof makeHoliday>[],
  allowPastDays: true,
  months: [makeDate(2025, 1, 1)],
};

describe('generateSuggestions', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
  });

  it('returns empty days when ptoDays is 0', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: 0, strategy: FilterStrategy.GROUPED });
    expect(result.days).toHaveLength(0);
  });

  it('returns empty days when ptoDays is negative', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: -1, strategy: FilterStrategy.GROUPED });
    expect(result.days).toHaveLength(0);
  });

  it('returns empty days when no available workdays (past month, allowPastDays=false)', () => {
    const result = generateSuggestions({
      ...BASE,
      ptoDays: 5,
      months: [makeDate(2020, 1, 1)],
      allowPastDays: false,
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days).toHaveLength(0);
  });

  it('includes the strategy in the result', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: 3, strategy: FilterStrategy.OPTIMIZED });
    expect(result.strategy).toBe(FilterStrategy.OPTIMIZED);
  });

  it('returns days sorted chronologically', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: 5, strategy: FilterStrategy.GROUPED });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });

  it('never suggests a day that is already a holiday', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6)); // Monday
    const result = generateSuggestions({ ...BASE, ptoDays: 5, holidays: [holiday], strategy: FilterStrategy.GROUPED });
    expect(result.days.some((day) => day.toDateString() === makeDate(2025, 1, 6).toDateString())).toBe(false);
  });

  it('ignores weekend holidays (they are not workdays)', () => {
    const weekendHoliday = makeHoliday(makeDate(2025, 1, 4)); // Saturday
    const result = generateSuggestions({
      ...BASE,
      ptoDays: 5,
      holidays: [weekendHoliday],
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days.length).toBeGreaterThan(0);
  });

  it('does not return weekend days', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: 10, strategy: FilterStrategy.OPTIMIZED });
    for (const day of result.days) {
      expect(day.getDay()).not.toBe(0);
      expect(day.getDay()).not.toBe(6);
    }
  });

  it.each([
    [FilterStrategy.GROUPED],
    [FilterStrategy.OPTIMIZED],
    [FilterStrategy.BALANCED],
  ] as const)('%s: returned days do not exceed ptoDays budget', (strategy) => {
    const ptoDays = 5;
    const result = generateSuggestions({ ...BASE, ptoDays, strategy });
    expect(result.days.length).toBeLessThanOrEqual(ptoDays);
  });

  it('caps to available workdays if ptoDays exceeds them', () => {
    const result = generateSuggestions({ ...BASE, ptoDays: 9999, strategy: FilterStrategy.GROUPED });
    expect(result.days.length).toBeLessThanOrEqual(23); // Jan 2025 has 23 workdays
  });
});
