import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  ensureDate,
  formatDate,
  getWeekdayNames,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from './dates';

describe('isSameDay', () => {
  it('returns true for the same date', () => {
    expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 1))).toBe(true);
  });

  it('returns false for different dates', () => {
    expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(false);
  });
});

describe('isSameMonth', () => {
  it('returns true for dates in the same month', () => {
    expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
  });

  it('returns false for different months', () => {
    expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 1, 1))).toBe(false);
  });
});

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend(new Date(2024, 0, 6))).toBe(true);
  });

  it('returns true for Sunday', () => {
    expect(isWeekend(new Date(2024, 0, 7))).toBe(true);
  });

  it('returns false for Monday', () => {
    expect(isWeekend(new Date(2024, 0, 8))).toBe(false);
  });
});

describe('addDays', () => {
  it('adds days correctly', () => {
    const result = addDays(new Date(2024, 0, 1), 5);
    expect(result.getDate()).toBe(6);
  });

  it('handles month boundaries', () => {
    const result = addDays(new Date(2024, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });
});

describe('addMonths', () => {
  it('adds months correctly', () => {
    const result = addMonths(new Date(2024, 0, 15), 2);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });
});

describe('differenceInDays', () => {
  it('returns positive when left is after right', () => {
    const left = new Date(2024, 0, 10);
    const right = new Date(2024, 0, 5);
    expect(differenceInDays(left, right)).toBe(5);
  });
});

describe('differenceInCalendarDays', () => {
  it('counts calendar days ignoring time', () => {
    const left = new Date(2024, 0, 3, 23, 59);
    const right = new Date(2024, 0, 1, 0, 0);
    expect(differenceInCalendarDays(left, right)).toBe(2);
  });
});

describe('startOfDay', () => {
  it('sets time to midnight', () => {
    const d = startOfDay(new Date(2024, 0, 15, 14, 30, 45));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });
});

describe('startOfMonth / endOfMonth', () => {
  it('startOfMonth returns the 1st', () => {
    expect(startOfMonth(new Date(2024, 5, 20)).getDate()).toBe(1);
  });

  it('endOfMonth returns the last day', () => {
    expect(endOfMonth(new Date(2024, 1, 5)).getDate()).toBe(29);
  });
});

describe('startOfWeek', () => {
  it('defaults to Sunday as week start', () => {
    const d = startOfWeek(new Date(2024, 0, 10));
    expect(d.getDay()).toBe(0);
  });

  it('respects weekStartsOn option', () => {
    const d = startOfWeek(new Date(2024, 0, 10), { weekStartsOn: 1 });
    expect(d.getDay()).toBe(1);
  });
});

describe('eachDayOfInterval', () => {
  it('returns all days in interval inclusive', () => {
    const days = eachDayOfInterval({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 3) });
    expect(days).toHaveLength(3);
  });
});

describe('isBefore', () => {
  it('returns true when date is earlier', () => {
    expect(isBefore(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(true);
  });
});

describe('ensureDate', () => {
  it('passes through Date objects', () => {
    const d = new Date(2024, 0, 1);
    expect(ensureDate(d)).toBe(d);
  });

  it('converts string to Date', () => {
    const result = ensureDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
  });
});

describe('formatDate', () => {
  it('formats as ISO date', () => {
    expect(formatDate({ date: new Date(2024, 0, 5), locale: 'en', format: 'yyyy-MM-dd' })).toBe('2024-01-05');
  });
});

describe('getWeekdayNames', () => {
  it('returns 7 names', () => {
    const names = getWeekdayNames({ locale: 'en' });
    expect(names).toHaveLength(7);
  });

  it('starts on Monday when weekStartsOn is 1', () => {
    const names = getWeekdayNames({ locale: 'en-US', weekStartsOn: 1, format: 'long' });
    expect(names[0].toLowerCase()).toContain('mon');
  });
});
