import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { describe, expect, it } from 'vitest';
import { freeStreaks } from './streaks';

const JAN = (day: number) => new Date(2025, 0, day);

const holiday = (day: number): HolidayDTO => ({
  id: `h-${day}`,
  date: JAN(day),
  name: `Holiday ${day}`,
  variant: HolidayVariant.NATIONAL,
  isInSelectedRange: true,
});

describe('freeStreaks', () => {
  it('answers nothing when the plan placed nothing, whatever Holidays exist', () => {
    expect(freeStreaks({ placedDays: [], holidays: [holiday(1)] })).toEqual([]);
  });

  it('marks whether a streak contains a day the plan placed', () => {
    const streaks = freeStreaks({ placedDays: [JAN(3)], holidays: [] });
    const placed = streaks.filter((streak) => streak.hasPlacedDay);

    expect(placed).toHaveLength(1);
    expect(placed[0]?.days.map((day) => day.getDate())).toEqual([3, 4, 5]);
  });

  it('marks whether a streak contains a weekend', () => {
    const streaks = freeStreaks({ placedDays: [JAN(8)], holidays: [] });
    const midweek = streaks.find((streak) => streak.days.some((day) => day.getDate() === 8));

    expect(midweek?.hasWeekend).toBe(false);
    expect(midweek?.length).toBe(1);
  });

  it('absorbs an adjacent Holiday into the streak, and stops at the first Workday nothing placed', () => {
    const streaks = freeStreaks({ placedDays: [JAN(2)], holidays: [holiday(1)] });
    const placed = streaks.find((streak) => streak.hasPlacedDay);

    expect(placed?.days.map((day) => day.getDate())).toEqual([1, 2]);
    expect(streaks.some((streak) => streak.days.map((day) => day.getDate()).join() === '4,5')).toBe(true);
  });

  it('scans past the last placed day, so a stretch running off the end is still whole', () => {
    const streaks = freeStreaks({ placedDays: [JAN(31)], holidays: [] });
    const last = streaks.at(-1);

    expect(last?.days.some((day) => day.getMonth() === 1)).toBe(true);
  });

  it('closes a streak on the first day that is neither free nor placed', () => {
    const streaks = freeStreaks({ placedDays: [JAN(3), JAN(10)], holidays: [] });

    expect(streaks.filter((streak) => streak.hasPlacedDay)).toHaveLength(2);
  });
});
