import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterStrategy } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { generateSuggestions } from './generateSuggestions';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './utils/selectors';

vi.mock('./utils/selectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/selectors')>();
  return {
    selectBridgesForStrategy: vi.fn(actual.selectBridgesForStrategy),
    selectOptimalDaysFromBridges: vi.fn(actual.selectOptimalDaysFromBridges),
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
    const holiday = makeHoliday(makeDate(2025, 1, 6));
    const result = generateSuggestions({ ...BASE, ptoDays: 5, holidays: [holiday], strategy: FilterStrategy.GROUPED });
    expect(result.days.some((day) => day.toDateString() === makeDate(2025, 1, 6).toDateString())).toBe(false);
  });

  it('ignores weekend holidays (they are not workdays)', () => {
    const weekendHoliday = makeHoliday(makeDate(2025, 1, 4));
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

  it.each([[FilterStrategy.GROUPED], [FilterStrategy.OPTIMIZED], [FilterStrategy.BALANCED]] as const)(
    '%s: returned days do not exceed ptoDays budget',
    (strategy) => {
      const ptoDays = 5;
      const result = generateSuggestions({ ...BASE, ptoDays, strategy });
      expect(result.days.length).toBeLessThanOrEqual(ptoDays);
    }
  );

  it('never places a Removed Day', () => {
    const removed = makeDate(2025, 1, 6);
    const result = generateSuggestions({
      ...BASE,
      ptoDays: 5,
      removedDays: [removed],
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.days.some((day) => day.toDateString() === removed.toDateString())).toBe(false);
  });

  it('does not let a Removed Day lengthen a neighbouring bridge', () => {
    const removed = makeDate(2025, 1, 6);
    const result = generateSuggestions({
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
    const result = generateSuggestions({ ...BASE, ptoDays: 9999, strategy: FilterStrategy.GROUPED });
    expect(result.days.length).toBeLessThanOrEqual(23);
  });

  describe('strategy dispatch', () => {
    it.each([[FilterStrategy.GROUPED], [FilterStrategy.OPTIMIZED]] as const)(
      '%s routes to selectBridgesForStrategy with its own strategy',
      (strategy) => {
        generateSuggestions({ ...BASE, ptoDays: 3, strategy });
        expect(selectBridgesForStrategy).toHaveBeenCalledWith(expect.objectContaining({ strategy }));
        expect(selectOptimalDaysFromBridges).not.toHaveBeenCalled();
      }
    );

    it('BALANCED routes to selectOptimalDaysFromBridges', () => {
      generateSuggestions({ ...BASE, ptoDays: 3, strategy: FilterStrategy.BALANCED });
      expect(selectOptimalDaysFromBridges).toHaveBeenCalledWith(expect.objectContaining({ targetPtoDays: 3 }));
      expect(selectBridgesForStrategy).not.toHaveBeenCalled();
    });

    it('falls back to GROUPED for an unknown strategy', () => {
      generateSuggestions({ ...BASE, ptoDays: 3, strategy: 'unknown' as FilterStrategy });
      expect(selectBridgesForStrategy).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: FilterStrategy.GROUPED })
      );
    });
  });
});
