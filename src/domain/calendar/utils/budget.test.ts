import { describe, expect, it } from 'vitest';
import { measureBudget } from './budget';

const JAN = (day: number) => new Date(2025, 0, day);

describe('measureBudget', () => {
  it('reports an untouched plan as spent in full by the days it placed', () => {
    expect(measureBudget({ ptoDays: 5, days: [JAN(6), JAN(7), JAN(8)] })).toEqual({
      suggested: 3,
      manual: 0,
      spent: 3,
      remaining: 2,
    });
  });

  it('returns a Removed Day to the budget', () => {
    expect(measureBudget({ ptoDays: 5, days: [JAN(6), JAN(7), JAN(8)], removedSuggestedDays: [JAN(7)] })).toEqual({
      suggested: 2,
      manual: 0,
      spent: 2,
      remaining: 3,
    });
  });

  it('charges a Manual Day against the budget', () => {
    expect(measureBudget({ ptoDays: 5, days: [JAN(6)], manuallySelectedDays: [JAN(20), JAN(21)] })).toEqual({
      suggested: 1,
      manual: 2,
      spent: 3,
      remaining: 2,
    });
  });

  it('counts the days exactly as the Metrics do, Removed and Manual Days together', () => {
    const measure = measureBudget({
      ptoDays: 10,
      days: [JAN(6), JAN(7), JAN(8)],
      manuallySelectedDays: [JAN(20)],
      removedSuggestedDays: [JAN(7)],
    });

    expect(measure).toEqual({ suggested: 2, manual: 1, spent: 3, remaining: 7 });
  });

  it('reports nothing left rather than a negative allowance when a plan overspends', () => {
    const measure = measureBudget({ ptoDays: 1, days: [JAN(6), JAN(7)], manuallySelectedDays: [JAN(20)] });

    expect(measure.spent).toBe(3);
    expect(measure.remaining).toBe(0);
  });

  it('answers for a plan that placed nothing at all', () => {
    expect(measureBudget({ ptoDays: 4 })).toEqual({ suggested: 0, manual: 0, spent: 0, remaining: 4 });
  });
});
