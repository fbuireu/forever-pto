import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearDateKeyCache, clearHolidayCache, createHolidaySet, getCombinationKey, getKey } from './cache';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

describe('getKey', () => {
  beforeEach(() => clearDateKeyCache());

  it('returns YYYY-M-D key with 0-indexed month', () => {
    expect(getKey(makeDate(2025, 1, 15))).toBe('2025-0-15');
    expect(getKey(makeDate(2025, 12, 31))).toBe('2025-11-31');
  });

  it('returns the same key for two dates representing the same day', () => {
    expect(getKey(makeDate(2025, 6, 1))).toBe(getKey(makeDate(2025, 6, 1)));
  });

  it('returns different keys for different days', () => {
    expect(getKey(makeDate(2025, 1, 1))).not.toBe(getKey(makeDate(2025, 1, 2)));
  });

  it('returns the cached result on repeated calls for the same timestamp', () => {
    const date = makeDate(2025, 3, 20);
    expect(getKey(date)).toBe(getKey(date));
  });
});

describe('getCombinationKey', () => {
  beforeEach(() => clearDateKeyCache());

  it('returns the same key regardless of input order', () => {
    const a = [makeDate(2025, 1, 1), makeDate(2025, 1, 5)];
    const b = [makeDate(2025, 1, 5), makeDate(2025, 1, 1)];
    expect(getCombinationKey(a)).toBe(getCombinationKey(b));
  });

  it('produces different keys for different day sets', () => {
    expect(getCombinationKey([makeDate(2025, 1, 1)])).not.toBe(getCombinationKey([makeDate(2025, 1, 2)]));
  });

  it('returns a comma-separated string of sorted keys', () => {
    const days = [makeDate(2025, 1, 3), makeDate(2025, 1, 1), makeDate(2025, 1, 2)];
    const parts = getCombinationKey(days).split(',');
    expect(parts.length).toBe(3);
    expect(parts).toEqual([...parts].sort((a, b) => a.localeCompare(b)));
  });
});

describe('createHolidaySet', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
  });

  it('includes weekday holidays', () => {
    // 2025-01-06 is a Monday
    const set = createHolidaySet([makeHoliday(makeDate(2025, 1, 6))]);
    expect(set.has(getKey(makeDate(2025, 1, 6)))).toBe(true);
  });

  it('excludes Saturday holidays', () => {
    // 2025-01-04 is a Saturday
    expect(createHolidaySet([makeHoliday(makeDate(2025, 1, 4))]).size).toBe(0);
  });

  it('excludes Sunday holidays', () => {
    // 2025-01-05 is a Sunday
    expect(createHolidaySet([makeHoliday(makeDate(2025, 1, 5))]).size).toBe(0);
  });

  it('returns an empty set for an empty holidays array', () => {
    expect(createHolidaySet([])).toEqual(new Set());
  });

  it('returns the same Set instance for the same cacheKey', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6));
    const s1 = createHolidaySet([holiday], 'key');
    const s2 = createHolidaySet([holiday], 'key');
    expect(s1).toBe(s2);
  });

  it('returns distinct Set instances for different cacheKeys', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6));
    const s1 = createHolidaySet([holiday], 'a');
    const s2 = createHolidaySet([holiday], 'b');
    expect(s1).not.toBe(s2);
  });

  it('clearHolidayCache invalidates the cache', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6));
    const before = createHolidaySet([holiday], 'key');
    clearHolidayCache();
    const after = createHolidaySet([holiday], 'key');
    expect(before).not.toBe(after);
  });
});
