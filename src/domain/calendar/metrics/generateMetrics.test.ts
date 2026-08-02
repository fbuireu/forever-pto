import { HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { FilterStrategy } from '../types';
import { generateMetrics } from './generateMetrics';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

const LOCALE = 'en' as const;
const YEAR = 2025;

describe('generateMetrics', () => {
  it('returns all-zero metrics when suggestion has no days', () => {
    const result = generateMetrics({
      suggestion: { days: [] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.longWeekends).toBe(0);
    expect(result.restBlocks).toBe(0);
    expect(result.maxWorkStreak).toBe(0);
    expect(result.firstLastBreak).toBeNull();
    expect(result.averageEfficiency).toBe(0);
    expect(result.bonusDays).toBe(0);
    expect(result.quarterDist).toEqual([0, 0, 0, 0]);
    expect(result.bridgesUsed).toBe(0);
    expect(result.workedDaysPerMonth).toBe(0);
    expect(result.totalEffectiveDays).toBe(0);
    expect(result.monthlyDist).toEqual(new Array(12).fill(0));
    expect(result.longBlocksPerQuarter).toEqual(new Array(4).fill(0));
    expect(result.longestVacation).toBe(0);
  });

  it('returns non-zero metrics for a populated suggestion', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)], strategy: FilterStrategy.GROUPED },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.restBlocks).toBe(1);
    expect(result.totalEffectiveDays).toBeGreaterThanOrEqual(1);
    expect(result.averageEfficiency).toBeGreaterThanOrEqual(1);
    expect(result.workedDaysPerMonth).toBeGreaterThan(0);
  });

  it('distributes days into the correct month bucket', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 1, 7)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.monthlyDist[0]).toBe(2);
    expect(result.quarterDist[0]).toBe(2);
  });

  it('returns correct firstLastBreak months', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 3, 10)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.firstLastBreak).not.toBeNull();
    expect(result.firstLastBreak?.first).toMatch(/January|january/i);
    expect(result.firstLastBreak?.last).toMatch(/March|march/i);
  });

  it('counts bridges used when bridges are provided', () => {
    const bridge = {
      startDate: makeDate(2025, 1, 4),
      endDate: makeDate(2025, 1, 6),
      ptoDaysNeeded: 1,
      effectiveDays: 3,
      efficiency: 3,
      ptoDays: [makeDate(2025, 1, 6)],
    };
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)], bridges: [bridge] },
      locale: LOCALE,
      year: YEAR,
      bridges: [bridge],
      holidays: [],
      allowPastDays: true,
    });
    expect(result.bridgesUsed).toBe(1);
    expect(result.averageEfficiency).toBe(3);
    expect(result.totalEffectiveDays).toBe(3);
    expect(result.bonusDays).toBe(2);
  });

  it('applies manuallySelectedDays by merging with suggestion days', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
      manuallySelectedDays: [makeDate(2025, 1, 7)],
    });
    expect(result.monthlyDist[0]).toBe(2);
  });

  it('applies removedSuggestedDays by excluding them', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 1, 7)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
      removedSuggestedDays: [makeDate(2025, 1, 6)],
    });
    expect(result.monthlyDist[0]).toBe(1);
  });

  it('counts the free days a bridge absorbs as one long block', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 3), makeDate(2025, 1, 6)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.longBlocksPerQuarter).toEqual([1, 0, 0, 0]);
  });

  it('passes holidays to the long-block scan', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 8), makeDate(2025, 1, 9)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [makeHoliday(makeDate(2025, 1, 10))],
      allowPastDays: true,
    });
    expect(result.longBlocksPerQuarter).toEqual([1, 0, 0, 0]);
  });

  it('measures bonus days against the days placed, not the budget', () => {
    const bridge = {
      startDate: makeDate(2025, 1, 4),
      endDate: makeDate(2025, 1, 6),
      ptoDaysNeeded: 1,
      effectiveDays: 3,
      efficiency: 3,
      ptoDays: [makeDate(2025, 1, 6)],
    };
    const params = {
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 1, 20)] },
      locale: LOCALE,
      year: YEAR,
      bridges: [bridge],
      holidays: [],
      allowPastDays: true,
      removedSuggestedDays: [makeDate(2025, 1, 20)],
    };
    const withoutBudget = generateMetrics(params);
    const withBudget = generateMetrics({ ...params, totalPtoBudget: 10 });
    expect(withoutBudget.bonusDays).toBe(2);
    expect(withBudget.bonusDays).toBe(withoutBudget.bonusDays);
  });

  it('scopes the year-wide metrics to the year passed in, not the year the first day falls in', () => {
    const carryOverDay = makeDate(2026, 1, 5);
    const params = {
      suggestion: { days: [carryOverDay] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
    };
    const planned = generateMetrics({ ...params, year: 2025 });
    const inferred = generateMetrics({ ...params, year: 2026 });

    expect(planned.workedDaysPerMonth).toBe(21.8);
    expect(inferred.workedDaysPerMonth).toBe(21.7);
    expect(planned.maxWorkStreak).toBe(261);
    expect(planned.maxWorkStreak).toBeGreaterThan(inferred.maxWorkStreak);
  });

  it('returns zero metrics when all suggested days are removed', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)] },
      locale: LOCALE,
      year: YEAR,
      holidays: [],
      allowPastDays: true,
      removedSuggestedDays: [makeDate(2025, 1, 6)],
    });
    expect(result.bonusDays).toBe(0);
    expect(result.totalEffectiveDays).toBe(0);
  });
});
