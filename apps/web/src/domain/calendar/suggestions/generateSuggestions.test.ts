import type { HolidayDTO } from '@application/dto/holiday/types';
import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterStrategy } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { findPlanningCandidates } from '../utils/candidates';
import { generateSuggestions } from './generateSuggestions';
import { selectBridgesForStrategy } from './utils/selectors';

const planSuggestions = ({
  ptoDays,
  holidays,
  allowPastDays,
  months,
  strategy,
  removedDays,
}: {
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  strategy: FilterStrategy;
  removedDays?: Date[];
}) =>
  generateSuggestions({
    ptoDays,
    strategy,
    candidates: findPlanningCandidates({ holidays, months, allowPastDays, removedDays }),
  });

vi.mock('./utils/selectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/selectors')>();
  return {
    selectBridgesForStrategy: vi.fn(actual.selectBridgesForStrategy),
  };
});

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

const BASE = {
  holidays: [] as ReturnType<typeof makeHoliday>[],
  allowPastDays: true,
  months: [makeDate(2025, 1, 1)],
};

describe('generateSuggestions', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
    vi.clearAllMocks();
  });

  it('returns empty days when ptoDays is 0', () => {
    const result = planSuggestions({ ...BASE, ptoDays: 0, strategy: FilterStrategy.GROUPED });
    expect(result.days).toHaveLength(0);
  });

  it('returns empty days when ptoDays is negative', () => {
    const result = planSuggestions({ ...BASE, ptoDays: -1, strategy: FilterStrategy.GROUPED });
    expect(result.days).toHaveLength(0);
  });

  it('returns empty days when no available workdays (past month, allowPastDays=false)', () => {
    const result = planSuggestions({
      ...BASE,
      ptoDays: 5,
      months: [makeDate(2020, 1, 1)],
      allowPastDays: false,
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days).toHaveLength(0);
  });

  it('includes the strategy in the result', () => {
    const result = planSuggestions({ ...BASE, ptoDays: 3, strategy: FilterStrategy.OPTIMIZED });
    expect(result.strategy).toBe(FilterStrategy.OPTIMIZED);
  });

  it('returns days sorted chronologically', () => {
    const result = planSuggestions({ ...BASE, ptoDays: 5, strategy: FilterStrategy.GROUPED });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });

  it('never suggests a day that is already a holiday', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6));
    const result = planSuggestions({ ...BASE, ptoDays: 5, holidays: [holiday], strategy: FilterStrategy.GROUPED });
    expect(result.days.some((day) => day.toDateString() === makeDate(2025, 1, 6).toDateString())).toBe(false);
  });

  it('ignores weekend holidays (they are not workdays)', () => {
    const weekendHoliday = makeHoliday(makeDate(2025, 1, 4));
    const result = planSuggestions({
      ...BASE,
      ptoDays: 5,
      holidays: [weekendHoliday],
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days.length).toBeGreaterThan(0);
  });

  it('does not return weekend days', () => {
    const result = planSuggestions({ ...BASE, ptoDays: 10, strategy: FilterStrategy.OPTIMIZED });
    for (const day of result.days) {
      expect(day.getDay()).not.toBe(0);
      expect(day.getDay()).not.toBe(6);
    }
  });

  it.each([[FilterStrategy.GROUPED], [FilterStrategy.OPTIMIZED], [FilterStrategy.BALANCED]] as const)(
    '%s: returned days do not exceed ptoDays budget',
    (strategy) => {
      const ptoDays = 5;
      const result = planSuggestions({ ...BASE, ptoDays, strategy });
      expect(result.days.length).toBeLessThanOrEqual(ptoDays);
    }
  );

  it('never places a Removed Day', () => {
    const removed = makeDate(2025, 1, 6);
    const result = planSuggestions({
      ...BASE,
      ptoDays: 5,
      removedDays: [removed],
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days.some((day) => day.toDateString() === removed.toDateString())).toBe(false);
  });

  it('does not let a Removed Day lengthen a neighbouring bridge', () => {
    const removed = makeDate(2025, 1, 6);
    const result = planSuggestions({
      ...BASE,
      ptoDays: 5,
      removedDays: [removed],
      strategy: FilterStrategy.GROUPED,
    });
    const covering = result.bridges?.filter(
      (bridge) => bridge.startDate.getTime() <= removed.getTime() && removed.getTime() <= bridge.endDate.getTime()
    );
    expect(covering).toEqual([]);
  });

  it('caps to available workdays if ptoDays exceeds them', () => {
    const result = planSuggestions({ ...BASE, ptoDays: 9999, strategy: FilterStrategy.GROUPED });
    expect(result.days.length).toBeLessThanOrEqual(23);
  });

  describe('strategy dispatch', () => {
    it.each([[FilterStrategy.GROUPED], [FilterStrategy.OPTIMIZED], [FilterStrategy.BALANCED]] as const)(
      'hands %s to the selector unchanged',
      (strategy) => {
        planSuggestions({ ...BASE, ptoDays: 3, strategy });
        expect(selectBridgesForStrategy).toHaveBeenCalledWith(expect.objectContaining({ strategy }));
      }
    );

    it('plans an unknown strategy as GROUPED, in the suggestion and in the alternatives alike', () => {
      const unknown = planSuggestions({ ...BASE, ptoDays: 3, strategy: 'unknown' as FilterStrategy });
      const grouped = planSuggestions({ ...BASE, ptoDays: 3, strategy: FilterStrategy.GROUPED });

      expect(unknown.days.map((day) => day.toDateString())).toEqual(grouped.days.map((day) => day.toDateString()));
    });
  });
});
