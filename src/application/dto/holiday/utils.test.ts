import { describe, expect, it } from 'vitest';
import { getRegionName, isInSelectedRange } from './utils';

const REGIONS = [
  { value: 'CAT', label: 'Catalonia' },
  { value: 'MAD', label: 'Madrid' },
];

describe('getRegionName', () => {
  it('returns the label for a matching region code (exact case)', () => {
    expect(getRegionName('CAT', REGIONS)).toBe('Catalonia');
  });

  it('is case-insensitive', () => {
    expect(getRegionName('cat', REGIONS)).toBe('Catalonia');
    expect(getRegionName('Cat', REGIONS)).toBe('Catalonia');
  });

  it('falls back to the original code when no region matches', () => {
    expect(getRegionName('UNKNOWN', REGIONS)).toBe('UNKNOWN');
  });

  it('returns empty string for an empty regionCode', () => {
    expect(getRegionName('', REGIONS)).toBe('');
  });

  it('falls back to code when regions array is empty', () => {
    expect(getRegionName('CAT', [])).toBe('CAT');
  });
});

describe('isInSelectedRange', () => {
  const rangeStart = new Date('2024-01-01T00:00:00.000Z');
  const rangeEnd = new Date('2024-12-31T23:59:59.999Z');

  it('returns true for a date within the range', () => {
    expect(isInSelectedRange({ date: new Date('2024-06-15'), rangeStart, rangeEnd })).toBe(true);
  });

  it('returns true for a date on the start boundary', () => {
    expect(isInSelectedRange({ date: rangeStart, rangeStart, rangeEnd })).toBe(true);
  });

  it('returns true for a date on the end boundary', () => {
    expect(isInSelectedRange({ date: rangeEnd, rangeStart, rangeEnd })).toBe(true);
  });

  it('returns false for a date before the range', () => {
    expect(isInSelectedRange({ date: new Date('2023-12-31'), rangeStart, rangeEnd })).toBe(false);
  });

  it('returns false for a date after the range', () => {
    expect(isInSelectedRange({ date: new Date('2025-01-01'), rangeStart, rangeEnd })).toBe(false);
  });
});
