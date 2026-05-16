import { HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { FilterStrategy } from '../types';
import { generateMetrics } from './generateMetrics';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const _makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

const LOCALE = 'en' as const;

// January 2025: Jan 6=Mon, Jan 7=Tue, Jan 8=Wed, Jan 9=Thu, Jan 10=Fri

describe('generateMetrics', () => {
  it('returns all-zero metrics when suggestion has no days', () => {
    const result = generateMetrics({
      suggestion: { days: [] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.longWeekends).toBe(0);
    expect(result.restBlocks).toBe(0);
    expect(result.maxWorkingPeriod).toBe(0);
    expect(result.firstLastBreak).toBeNull();
    expect(result.averageEfficiency).toBe(0);
    expect(result.bonusDays).toBe(0);
    expect(result.quarterDist).toEqual([0, 0, 0, 0]);
    expect(result.bridgesUsed).toBe(0);
    expect(result.workingDaysPerMonth).toBe(0);
    expect(result.totalEffectiveDays).toBe(0);
    expect(result.monthlyDist).toEqual(new Array(12).fill(0));
    expect(result.longBlocksPerQuarter).toEqual(new Array(4).fill(0));
    expect(result.longestVacation).toBe(0);
  });

  it('returns non-zero metrics for a populated suggestion', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)], strategy: FilterStrategy.GROUPED },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.restBlocks).toBe(1);
    expect(result.totalEffectiveDays).toBeGreaterThanOrEqual(1);
    expect(result.averageEfficiency).toBeGreaterThanOrEqual(1);
    expect(result.workingDaysPerMonth).toBeGreaterThan(0);
  });

  it('distributes days into the correct month bucket', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 1, 7)] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.monthlyDist[0]).toBe(2); // January = index 0
    expect(result.quarterDist[0]).toBe(2); // Q1
  });

  it('returns correct firstLastBreak months', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 3, 10)] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
    });
    expect(result.firstLastBreak).not.toBeNull();
    expect(result.firstLastBreak?.first).toMatch(/January|january/i);
    expect(result.firstLastBreak?.last).toMatch(/March|march/i);
  });

  it('counts bridges used when bridges are provided', () => {
    const bridge = {
      startDate: makeDate(2025, 1, 6),
      endDate: makeDate(2025, 1, 6),
      ptoDaysNeeded: 1,
      effectiveDays: 3,
      efficiency: 3,
      ptoDays: [makeDate(2025, 1, 6)],
    };
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)], bridges: [bridge] },
      locale: LOCALE,
      bridges: [bridge],
      holidays: [],
      allowPastDays: true,
    });
    expect(result.bridgesUsed).toBe(1);
    expect(result.totalEffectiveDays).toBe(3);
    expect(result.bonusDays).toBe(2); // 3 effective - 1 PTO
  });

  it('applies manuallySelectedDays by merging with suggestion days', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
      manuallySelectedDays: [makeDate(2025, 1, 7)],
    });
    expect(result.monthlyDist[0]).toBe(2); // Jan 6 + Jan 7
  });

  it('applies removedSuggestedDays by excluding them', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6), makeDate(2025, 1, 7)] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
      removedSuggestedDays: [makeDate(2025, 1, 6)],
    });
    expect(result.monthlyDist[0]).toBe(1); // only Jan 7 remains
  });

  it('returns zero metrics when all suggested days are removed', () => {
    const result = generateMetrics({
      suggestion: { days: [makeDate(2025, 1, 6)] },
      locale: LOCALE,
      holidays: [],
      allowPastDays: true,
      removedSuggestedDays: [makeDate(2025, 1, 6)],
    });
    expect(result.bonusDays).toBe(0);
    expect(result.totalEffectiveDays).toBe(0);
  });
});
