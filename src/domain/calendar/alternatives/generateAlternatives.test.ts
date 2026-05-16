import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { FilterStrategy } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { generateAlternatives } from './generateAlternatives';

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
  strategy: FilterStrategy.GROUPED,
};

describe('generateAlternatives', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
  });

  it('returns empty array when ptoDays is 0', () => {
    expect(
      generateAlternatives({ ...BASE, ptoDays: 0, maxAlternatives: 3, existingSuggestion: [makeDate(2025, 1, 6)] })
    ).toHaveLength(0);
  });

  it('returns empty array when ptoDays is negative', () => {
    expect(
      generateAlternatives({ ...BASE, ptoDays: -1, maxAlternatives: 3, existingSuggestion: [makeDate(2025, 1, 6)] })
    ).toHaveLength(0);
  });

  it('returns empty array when maxAlternatives is 0', () => {
    expect(
      generateAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 0, existingSuggestion: [makeDate(2025, 1, 6)] })
    ).toHaveLength(0);
  });

  it('returns empty array when existingSuggestion is empty', () => {
    expect(generateAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 3, existingSuggestion: [] })).toHaveLength(0);
  });

  it('returns at most maxAlternatives alternatives', () => {
    const result = generateAlternatives({
      ...BASE,
      ptoDays: 3,
      maxAlternatives: 2,
      existingSuggestion: [makeDate(2025, 1, 6)],
    });
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('alternatives do not contain days from existingSuggestion', () => {
    const existingSuggestion = [makeDate(2025, 1, 6)];
    const existing = new Set(existingSuggestion.map((day) => day.toDateString()));
    const result = generateAlternatives({
      ...BASE,
      ptoDays: 3,
      maxAlternatives: 3,
      existingSuggestion,
    });
    for (const alt of result) {
      for (const day of alt.days) {
        expect(existing.has(day.toDateString())).toBe(false);
      }
    }
  });

  it('all alternatives have distinct day sets', () => {
    const result = generateAlternatives({
      ...BASE,
      ptoDays: 5,
      maxAlternatives: 5,
      existingSuggestion: [makeDate(2025, 1, 6)],
    });
    const keys = result.map((alt) =>
      alt.days
        .map((day) => day.toDateString())
        .sort()
        .join(',')
    );
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('each alternative has days sorted chronologically', () => {
    const result = generateAlternatives({
      ...BASE,
      ptoDays: 5,
      maxAlternatives: 3,
      existingSuggestion: [makeDate(2025, 1, 6)],
    });
    for (const alt of result) {
      for (let i = 1; i < alt.days.length; i++) {
        expect(alt.days[i - 1].getTime()).toBeLessThanOrEqual(alt.days[i].getTime());
      }
    }
  });

  it('works with BALANCED strategy', () => {
    const result = generateAlternatives({
      ...BASE,
      strategy: FilterStrategy.BALANCED,
      ptoDays: 3,
      maxAlternatives: 2,
      existingSuggestion: [makeDate(2025, 1, 6)],
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns no alternatives when no workdays are available (past months, allowPastDays=false)', () => {
    const result = generateAlternatives({
      ...BASE,
      ptoDays: 3,
      maxAlternatives: 3,
      allowPastDays: false,
      months: [makeDate(2020, 1, 1)],
      existingSuggestion: [makeDate(2020, 1, 6)],
    });
    expect(result).toHaveLength(0);
  });
});
