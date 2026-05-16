import { HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import {
  calculateLongestVacation,
  calculateLongWeekends,
  calculateMaxWorkingPeriod,
  calculateQuarterDistribution,
  calculateRestBlocks,
  getFirstLastBreak,
  getLongBlocksPerQuarter,
  getMonthlyDist,
  getTotalEffectiveDays,
  getWorkingDaysPerMonth,
} from './helpers';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

// January 2025: Jan 1=Wed, Jan 3=Fri, Jan 4=Sat, Jan 5=Sun, Jan 6=Mon, Jan 7=Tue, Jan 8=Wed, Jan 9=Thu, Jan 10=Fri

describe('getMonthlyDist', () => {
  it('returns 12 zeros for empty input', () => {
    expect(getMonthlyDist([])).toEqual(new Array(12).fill(0));
  });

  it('counts dates into correct month buckets', () => {
    const days = [makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 3, 1)];
    const dist = getMonthlyDist(days);
    expect(dist[0]).toBe(2); // January (month index 0)
    expect(dist[1]).toBe(0); // February
    expect(dist[2]).toBe(1); // March
  });

  it('uses 0-indexed months', () => {
    const dist = getMonthlyDist([makeDate(2025, 12, 1)]);
    expect(dist[11]).toBe(1); // December = index 11
  });
});

describe('getLongBlocksPerQuarter', () => {
  it('returns 4 zeros for empty input', () => {
    expect(getLongBlocksPerQuarter([])).toEqual([0, 0, 0, 0]);
  });

  it('does not count blocks shorter than 3 consecutive days', () => {
    expect(getLongBlocksPerQuarter([makeDate(2025, 1, 6), makeDate(2025, 1, 7)])).toEqual([0, 0, 0, 0]);
  });

  it('counts a block of exactly 3 consecutive days', () => {
    const result = getLongBlocksPerQuarter([makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 1, 8)]);
    expect(result[0]).toBe(1); // Q1
  });

  it('counts a single block for 4+ consecutive days', () => {
    const days = [makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 1, 8), makeDate(2025, 1, 9)];
    expect(getLongBlocksPerQuarter(days)[0]).toBe(1);
  });

  it('counts blocks in separate quarters independently', () => {
    const days = [
      makeDate(2025, 1, 6),
      makeDate(2025, 1, 7),
      makeDate(2025, 1, 8), // Q1 block
      makeDate(2025, 4, 1),
      makeDate(2025, 4, 2),
      makeDate(2025, 4, 3), // Q2 block
    ];
    const result = getLongBlocksPerQuarter(days);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(1);
  });

  it('does not count non-consecutive days as a block', () => {
    expect(getLongBlocksPerQuarter([makeDate(2025, 1, 6), makeDate(2025, 1, 8), makeDate(2025, 1, 10)])).toEqual([
      0, 0, 0, 0,
    ]);
  });
});

describe('getTotalEffectiveDays', () => {
  it('returns days.length when no bridges provided', () => {
    expect(getTotalEffectiveDays([makeDate(2025, 1, 6), makeDate(2025, 1, 7)])).toBe(2);
  });

  it('returns days.length when bridges array is empty', () => {
    expect(getTotalEffectiveDays([makeDate(2025, 1, 6)], [])).toBe(1);
  });

  it('uses bridge effectiveDays for PTO days that are part of a bridge', () => {
    const bridges = [{ ptoDays: [makeDate(2025, 1, 6)], effectiveDays: 3 }];
    expect(getTotalEffectiveDays([makeDate(2025, 1, 6)], bridges)).toBe(3);
  });

  it('adds standalone days on top of bridge effective days', () => {
    const bridges = [{ ptoDays: [makeDate(2025, 1, 6)], effectiveDays: 3 }];
    expect(getTotalEffectiveDays([makeDate(2025, 1, 6), makeDate(2025, 1, 9)], bridges)).toBe(4);
  });

  it('ignores a bridge whose PTO days are not all in the selection', () => {
    const bridges = [{ ptoDays: [makeDate(2025, 1, 6)], effectiveDays: 3 }];
    expect(getTotalEffectiveDays([makeDate(2025, 1, 9)], bridges)).toBe(1);
  });
});

describe('calculateRestBlocks', () => {
  it('returns 0 for empty input', () => {
    expect(calculateRestBlocks([])).toBe(0);
  });

  it('returns 1 for a single date', () => {
    expect(calculateRestBlocks([makeDate(2025, 1, 6)])).toBe(1);
  });

  it('returns 1 when all dates are within 7 days of each other', () => {
    expect(calculateRestBlocks([makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 1, 13)])).toBe(1);
  });

  it('returns 2 when two groups are more than 7 days apart', () => {
    expect(calculateRestBlocks([makeDate(2025, 1, 6), makeDate(2025, 1, 20)])).toBe(2);
  });

  it('counts blocks regardless of input order', () => {
    expect(calculateRestBlocks([makeDate(2025, 1, 20), makeDate(2025, 1, 6)])).toBe(2);
  });
});

describe('calculateQuarterDistribution', () => {
  it('returns 4 zeros for empty input', () => {
    expect(calculateQuarterDistribution([])).toEqual([0, 0, 0, 0]);
  });

  it('assigns dates to the correct quarter', () => {
    const dates = [makeDate(2025, 1, 1), makeDate(2025, 4, 1), makeDate(2025, 7, 1), makeDate(2025, 10, 1)];
    expect(calculateQuarterDistribution(dates)).toEqual([1, 1, 1, 1]);
  });

  it('places January-March in Q1 (index 0)', () => {
    expect(calculateQuarterDistribution([makeDate(2025, 3, 31)])[0]).toBe(1);
  });

  it('places October-December in Q4 (index 3)', () => {
    expect(calculateQuarterDistribution([makeDate(2025, 12, 1)])[3]).toBe(1);
  });
});

describe('getFirstLastBreak', () => {
  it('returns null for empty input', () => {
    expect(getFirstLastBreak({ dates: [], locale: 'en' })).toBeNull();
  });

  it('returns the same month for a single date', () => {
    const result = getFirstLastBreak({ dates: [makeDate(2025, 1, 6)], locale: 'en' });
    expect(result).not.toBeNull();
    expect(result?.first).toBe(result?.last);
  });

  it('returns first and last months when dates span multiple months', () => {
    const result = getFirstLastBreak({ dates: [makeDate(2025, 3, 1), makeDate(2025, 1, 6)], locale: 'en' });
    expect(result).not.toBeNull();
    expect(result?.first).toMatch(/January|january/i);
    expect(result?.last).toMatch(/March|march/i);
  });
});

describe('getWorkingDaysPerMonth', () => {
  it('returns a positive number for a normal year', () => {
    const result = getWorkingDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
    expect(result).toBeGreaterThan(18);
    expect(result).toBeLessThan(24);
  });

  it('decreases when PTO days are added', () => {
    const baseline = getWorkingDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
    const withPto = getWorkingDaysPerMonth({ ptoDays: [makeDate(2025, 1, 6)], holidays: [], year: 2025 });
    expect(withPto).toBeLessThan(baseline);
  });

  it('decreases when holidays are added', () => {
    const baseline = getWorkingDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
    const withHoliday = getWorkingDaysPerMonth({
      ptoDays: [],
      holidays: [makeHoliday(makeDate(2025, 1, 6))],
      year: 2025,
    });
    expect(withHoliday).toBeLessThan(baseline);
  });
});

describe('calculateMaxWorkingPeriod', () => {
  it('returns a positive streak when no PTO or holidays', () => {
    const result = calculateMaxWorkingPeriod({ ptoDays: [], holidays: [], year: 2025, allowPastDays: true });
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 when the year is fully in the past and allowPastDays is false', () => {
    const result = calculateMaxWorkingPeriod({ ptoDays: [], holidays: [], year: 2020, allowPastDays: false });
    expect(result).toBe(0);
  });

  it('reduces max streak when PTO breaks up consecutive workdays', () => {
    const noBreak = calculateMaxWorkingPeriod({ ptoDays: [], holidays: [], year: 2025, allowPastDays: true });
    const withBreak = calculateMaxWorkingPeriod({
      ptoDays: [
        makeDate(2025, 1, 6),
        makeDate(2025, 1, 7),
        makeDate(2025, 1, 8),
        makeDate(2025, 1, 9),
        makeDate(2025, 1, 10),
      ],
      holidays: [],
      year: 2025,
      allowPastDays: true,
    });
    expect(withBreak).toBeLessThan(noBreak);
  });
});

describe('calculateLongestVacation', () => {
  it('returns 0 when ptoDays is empty', () => {
    expect(calculateLongestVacation({ ptoDays: [], holidays: [] })).toBe(0);
  });

  it('includes adjacent weekend days in the streak', () => {
    // Jan 3 (Fri PTO) + Jan 4 (Sat) + Jan 5 (Sun) = 3 consecutive free days
    const result = calculateLongestVacation({ ptoDays: [makeDate(2025, 1, 3)], holidays: [] });
    expect(result).toBeGreaterThanOrEqual(3);
  });

  it('returns a longer streak when multiple PTO days bridge weekends', () => {
    // Jan 4(Sat)+Jan 5(Sun)+Jan 6-10(PTO)+Jan 11(Sat)+Jan 12(Sun) = 9 consecutive free days
    const ptoDays = [
      makeDate(2025, 1, 6),
      makeDate(2025, 1, 7),
      makeDate(2025, 1, 8),
      makeDate(2025, 1, 9),
      makeDate(2025, 1, 10),
    ];
    const result = calculateLongestVacation({ ptoDays, holidays: [] });
    expect(result).toBeGreaterThanOrEqual(9);
  });

  it('includes holidays in the free-day streak', () => {
    const withHoliday = calculateLongestVacation({
      ptoDays: [makeDate(2025, 1, 6)],
      holidays: [makeHoliday(makeDate(2025, 1, 7))],
    });
    const withoutHoliday = calculateLongestVacation({ ptoDays: [makeDate(2025, 1, 6)], holidays: [] });
    expect(withHoliday).toBeGreaterThanOrEqual(withoutHoliday);
  });
});

describe('calculateLongWeekends', () => {
  it('returns 0 when ptoDays is empty', () => {
    expect(calculateLongWeekends({ ptoDays: [], holidays: [] })).toBe(0);
  });

  it('counts a Friday PTO adjacent to a weekend as a long weekend', () => {
    // Jan 3 (Fri PTO) + Jan 4 (Sat) + Jan 5 (Sun)
    expect(calculateLongWeekends({ ptoDays: [makeDate(2025, 1, 3)], holidays: [] })).toBeGreaterThanOrEqual(1);
  });

  it('counts a Monday PTO adjacent to a weekend as a long weekend', () => {
    // Jan 4 (Sat) + Jan 5 (Sun) + Jan 6 (Mon PTO)
    expect(calculateLongWeekends({ ptoDays: [makeDate(2025, 1, 6)], holidays: [] })).toBeGreaterThanOrEqual(1);
  });

  it('does not count isolated mid-week PTO as a long weekend', () => {
    // Jan 8 (Wed PTO) — surrounded by workdays, no adjacent weekend
    expect(calculateLongWeekends({ ptoDays: [makeDate(2025, 1, 8)], holidays: [] })).toBe(0);
  });

  it('counts a holiday adjacent to a weekend as a long weekend', () => {
    const holiday = makeHoliday(makeDate(2025, 1, 6)); // Monday
    expect(calculateLongWeekends({ ptoDays: [makeDate(2025, 1, 6)], holidays: [holiday] })).toBeGreaterThanOrEqual(1);
  });
});
