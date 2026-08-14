import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { runPlanningPipeline } from './pipeline';
import { FilterStrategy } from './types';

const YEAR = 2025;

const monthsFor = (carryOverMonths: number) =>
  Array.from({ length: 12 + carryOverMonths }, (_, index) => new Date(YEAR, index, 1));

const holiday = (id: string, date: Date): HolidayDTO => ({
  id,
  date,
  name: id,
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

const baseInput = {
  year: YEAR,
  ptoDays: 5,
  holidays: [holiday('new-year', new Date(YEAR, 0, 1)), holiday('epiphany', new Date(YEAR, 0, 6))],
  allowPastDays: true,
  months: monthsFor(0),
  strategy: FilterStrategy.GROUPED,
  locale: 'en',
  maxAlternatives: 2,
};

describe('runPlanningPipeline', () => {
  it('plans a Suggestion and measures it in one call', () => {
    const result = runPlanningPipeline(baseInput);

    expect(result.planned).toBe(true);
    expect(result.suggestion.days.length).toBeGreaterThan(0);
    expect(result.suggestion.metrics).toBeDefined();
    expect(result.alternatives.every((alternative) => alternative.metrics !== undefined)).toBe(true);
  });

  it('takes Manual Days out of the budget and plans around them', () => {
    const manual = [new Date(YEAR, 6, 7), new Date(YEAR, 6, 8)];

    const result = runPlanningPipeline({ ...baseInput, ptoDays: 5, manuallySelectedDays: manual });

    expect(result.suggestion.days.length).toBeLessThanOrEqual(3);
    expect(result.suggestion.days.some((day) => day.getTime() === manual[0].getTime())).toBe(false);
  });

  describe('the empty result', () => {
    it('reports it did not plan, rather than an empty plan that looks calculated', () => {
      const result = runPlanningPipeline({ ...baseInput, ptoDays: 0 });

      expect(result.planned).toBe(false);
      expect(result.suggestion.days).toEqual([]);
      expect(result.alternatives).toEqual([]);
    });

    it('carries Metrics measured by the engine, never absent', () => {
      const { suggestion } = runPlanningPipeline({ ...baseInput, ptoDays: 0 });

      expect(suggestion.metrics).toBeDefined();
      expect(suggestion.metrics?.averageEfficiency).toBe(0);
      expect(suggestion.metrics?.totalEffectiveDays).toBe(0);
      expect(suggestion.metrics?.firstLastBreak).toBeNull();
    });

    it('sizes those Metrics to the Planning Window, not to a hard-coded twelve months', () => {
      const { suggestion } = runPlanningPipeline({ ...baseInput, ptoDays: 0, months: monthsFor(3) });

      expect(suggestion.metrics?.monthlyDist).toHaveLength(15);
      expect(suggestion.metrics?.monthlyDist.every((count) => count === 0)).toBe(true);
    });

    it('refuses to plan when there is nothing free to bridge', () => {
      expect(runPlanningPipeline({ ...baseInput, holidays: [] }).planned).toBe(false);
    });
  });

  it('clears the calculation caches itself, so a second run sees its own Holidays', () => {
    const first = runPlanningPipeline(baseInput);

    const second = runPlanningPipeline({
      ...baseInput,
      holidays: [holiday('assumption', new Date(YEAR, 7, 15)), holiday('all-saints', new Date(YEAR, 10, 1))],
    });

    const firstMonths = new Set(first.suggestion.days.map((day) => day.getMonth()));
    const secondMonths = new Set(second.suggestion.days.map((day) => day.getMonth()));

    expect(second.planned).toBe(true);
    expect([...secondMonths].some((month) => !firstMonths.has(month))).toBe(true);
  });
});
