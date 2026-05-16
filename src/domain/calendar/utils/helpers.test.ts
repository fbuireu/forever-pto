import { HolidayVariant } from '@application/dto/holiday/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearDateKeyCache, clearHolidayCache } from './cache';
import { findBridges, getAvailableWorkdays } from './helpers';

// January 2025: 1=Wed, 3=Fri, 4=Sat, 5=Sun, 6=Mon, 7=Tue, 8=Wed, 9=Thu, 10=Fri, 11=Sat
const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
  id: `h-${date.toISOString()}`,
  date,
  name: 'Test Holiday',
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

describe('getAvailableWorkdays', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
  });

  it('excludes all weekend days', () => {
    const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
    for (const day of workdays) {
      expect(day.getDay()).not.toBe(0);
      expect(day.getDay()).not.toBe(6);
    }
  });

  it('returns 23 workdays for January 2025 with no holidays', () => {
    const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
    expect(workdays).toHaveLength(23);
  });

  it('excludes holiday workdays', () => {
    const workdays = getAvailableWorkdays({
      months: [makeDate(2025, 1, 1)],
      holidays: [makeHoliday(makeDate(2025, 1, 6))], // Monday
      allowPastDays: true,
    });
    expect(workdays).toHaveLength(22);
    expect(workdays.some((w) => w.toDateString() === makeDate(2025, 1, 6).toDateString())).toBe(false);
  });

  it('does not exclude a weekend holiday (weekend already excluded)', () => {
    const workdays = getAvailableWorkdays({
      months: [makeDate(2025, 1, 1)],
      holidays: [makeHoliday(makeDate(2025, 1, 4))], // Saturday
      allowPastDays: true,
    });
    expect(workdays).toHaveLength(23);
  });

  it('excludes all days when allowPastDays is false and month is fully in the past', () => {
    const workdays = getAvailableWorkdays({ months: [makeDate(2020, 1, 1)], holidays: [], allowPastDays: false });
    expect(workdays).toHaveLength(0);
  });

  it('includes past days when allowPastDays is true', () => {
    const workdays = getAvailableWorkdays({ months: [makeDate(2020, 1, 1)], holidays: [], allowPastDays: true });
    expect(workdays.length).toBeGreaterThan(0);
  });

  it('combines workdays across multiple months', () => {
    const jan = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
    const feb = getAvailableWorkdays({ months: [makeDate(2025, 2, 1)], holidays: [], allowPastDays: true });
    const both = getAvailableWorkdays({
      months: [makeDate(2025, 1, 1), makeDate(2025, 2, 1)],
      holidays: [],
      allowPastDays: true,
    });
    expect(both).toHaveLength(jan.length + feb.length);
  });
});

describe('findBridges', () => {
  beforeEach(() => {
    clearDateKeyCache();
    clearHolidayCache();
  });

  it('returns an empty array when there are no workdays', () => {
    expect(findBridges({ availableWorkdays: [], holidays: [] })).toEqual([]);
  });

  it('returns a bridge for a Monday (adjacent to the preceding weekend)', () => {
    // Jan 6 (Mon): Sat Jan 4 + Sun Jan 5 precede it → effectiveDays = 3
    const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 6)], holidays: [] });
    const bridge = bridges.find((b) => b.ptoDays[0].toDateString() === makeDate(2025, 1, 6).toDateString());
    expect(bridge).toBeDefined();
    expect(bridge?.ptoDaysNeeded).toBe(1);
    expect(bridge?.effectiveDays).toBe(3);
    expect(bridge?.efficiency).toBe(3);
  });

  it('returns a bridge for a Friday (adjacent to the following weekend)', () => {
    // Jan 10 (Fri): Sat Jan 11 + Sun Jan 12 follow it → effectiveDays = 3
    const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 10)], holidays: [] });
    expect(bridges).toHaveLength(1);
    expect(bridges[0].effectiveDays).toBe(3);
    expect(bridges[0].efficiency).toBe(3);
  });

  it('does not create a bridge for an isolated mid-week workday', () => {
    // Jan 8 (Wed): no adjacent free day
    const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 8)], holidays: [] });
    expect(bridges).toHaveLength(0);
  });

  it('creates a 2-day bridge when consecutive days bridge a weekend', () => {
    // Thu Jan 9 + Fri Jan 10 → +Sat+Sun = 4 effective days
    const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 9), makeDate(2025, 1, 10)], holidays: [] });
    const multiDay = bridges.find((b) => b.ptoDaysNeeded === 2);
    expect(multiDay).toBeDefined();
    expect(multiDay?.effectiveDays).toBe(4);
    expect(multiDay?.efficiency).toBe(2);
  });

  it('expands the effective range to absorb an adjacent holiday', () => {
    // Workday: Thu Jan 9. Holiday: Fri Jan 10 → effective block extends to Sat+Sun
    const holiday = makeHoliday(makeDate(2025, 1, 10));
    const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 9)], holidays: [holiday] });
    const bridge = bridges.find((b) => b.ptoDays[0].toDateString() === makeDate(2025, 1, 9).toDateString());
    expect(bridge).toBeDefined();
    expect(bridge?.effectiveDays).toBe(4); // Thu + Fri(holiday) + Sat + Sun
  });

  it('deduplicates bridges with identical PTO day sets', () => {
    const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
    const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
    const keys = bridges.map((b) =>
      b.ptoDays
        .map((p) => p.toDateString())
        .sort()
        .join(',')
    );
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('places higher-efficiency bridges before lower-efficiency ones', () => {
    // Mon (eff 3.0) and Mon+Tue (eff 2.0) — diff 1.0 > threshold 0.1
    const workdays = [makeDate(2025, 1, 6), makeDate(2025, 1, 7)];
    const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
    const singleIdx = bridges.findIndex((b) => b.ptoDaysNeeded === 1);
    const multiIdx = bridges.findIndex((b) => b.ptoDaysNeeded === 2);
    if (singleIdx !== -1 && multiIdx !== -1) {
      expect(singleIdx).toBeLessThan(multiIdx);
    }
  });
});
