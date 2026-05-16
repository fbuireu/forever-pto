import { describe, expect, it } from 'vitest';
import { holidayDTO } from './dto';
import { HolidayVariant } from './types';
import type { HolidayDTO, RawHoliday } from './types';

const REGIONS = [{ value: 'CAT', label: 'Catalonia' }];

const makeRaw = (overrides: Partial<RawHoliday> & { date: string; name: string }): RawHoliday =>
  ({
    start: new Date(overrides.date),
    end: new Date(overrides.date),
    type: 'public',
    substitute: false,
    ...overrides,
  }) as RawHoliday;

const BASE_PARAMS = { year: 2024, carryOverMonths: 0, regions: REGIONS };

describe('holidayDTO', () => {
  it('returns an empty array for empty input', () => {
    expect(holidayDTO.create({ raw: [], params: BASE_PARAMS })).toEqual([]);
  });

  it('throws when params are missing', () => {
    // @ts-expect-error intentionally passing undefined params to test the guard
    expect(() => holidayDTO.create({ raw: [] })).toThrow('Configuration is required');
  });

  it('maps a national holiday to a HolidayDTO with NATIONAL variant', () => {
    const raw = [makeRaw({ date: '2024-01-01', name: 'New Year' })];
    const [result] = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result?.name).toBe('New Year');
    expect(result?.date).toBeInstanceOf(Date);
    expect(result?.variant).toBe(HolidayVariant.NATIONAL);
    expect(result?.id).toBe('national-2024-01-01');
    expect(result?.location).toBeUndefined();
  });

  it('maps a regional holiday to a HolidayDTO with REGIONAL variant and resolved location', () => {
    const raw = [makeRaw({ date: '2024-04-23', name: "Sant Jordi", location: 'CAT' })];
    const [result] = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result?.variant).toBe(HolidayVariant.REGIONAL);
    expect(result?.location).toBe('Catalonia');
    expect(result?.id).toBe('regional-2024-04-23');
  });

  it('falls back to region code when region is not in the regions list', () => {
    const raw = [makeRaw({ date: '2024-04-23', name: 'Local Holiday', location: 'UNKNOWN' })];
    const [result] = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result?.location).toBe('UNKNOWN');
  });

  it('deduplicates holidays on the same date, keeping the national one', () => {
    const raw = [
      makeRaw({ date: '2024-01-01', name: 'New Year National' }),
      makeRaw({ date: '2024-01-01', name: 'New Year Regional', location: 'CAT' }),
    ];

    const result = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result).toHaveLength(1);
    expect(result[0]?.variant).toBe(HolidayVariant.NATIONAL);
  });

  it('filters out holidays outside the year and next year range', () => {
    const raw = [
      makeRaw({ date: '2023-12-31', name: 'Last Year' }),
      makeRaw({ date: '2024-06-15', name: 'This Year' }),
      makeRaw({ date: '2026-01-01', name: 'Too Far Future' }),
    ];

    const result = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('This Year');
  });

  it('includes holidays in the next year (carry-over window)', () => {
    const raw = [makeRaw({ date: '2025-03-01', name: 'Next Year Holiday' })];
    const result = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result).toHaveLength(1);
  });

  it('marks holiday as isInSelectedRange=true when within the year', () => {
    const raw = [makeRaw({ date: '2024-06-15', name: 'Summer Holiday' })];
    const [result] = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result?.isInSelectedRange).toBe(true);
  });

  it('marks holiday as isInSelectedRange=false when in next year with carryOverMonths=0', () => {
    const raw = [makeRaw({ date: '2025-01-15', name: 'January Next Year' })];
    const [result] = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result?.isInSelectedRange).toBe(false);
  });

  it('marks carry-over holiday as isInSelectedRange=true when within carryOverMonths', () => {
    const raw = [makeRaw({ date: '2025-02-01', name: 'February Holiday' })];
    const params = { ...BASE_PARAMS, carryOverMonths: 3 };
    const [result] = holidayDTO.create({ raw, params });

    expect(result?.isInSelectedRange).toBe(true);
  });

  it('returns holidays sorted by date ascending', () => {
    const raw = [
      makeRaw({ date: '2024-12-25', name: 'Christmas' }),
      makeRaw({ date: '2024-01-01', name: 'New Year' }),
      makeRaw({ date: '2024-06-24', name: 'Midsummer' }),
    ];

    const result = holidayDTO.create({ raw, params: BASE_PARAMS });

    expect(result[0]?.name).toBe('New Year');
    expect(result[1]?.name).toBe('Midsummer');
    expect(result[2]?.name).toBe('Christmas');
  });
});

describe('holidayDTO.createCustom', () => {
  const BASE = { name: 'Day Off', date: new Date('2024-06-15'), locale: 'en', year: 2024, carryOverMonths: 0 };

  it('creates a CUSTOM variant holiday', () => {
    const result = holidayDTO.createCustom(BASE);
    expect(result.variant).toBe(HolidayVariant.CUSTOM);
  });

  it('id starts with "custom-"', () => {
    const result = holidayDTO.createCustom(BASE);
    expect(result.id).toMatch(/^custom-/);
  });

  it('date is a Date instance', () => {
    const result = holidayDTO.createCustom(BASE);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('preserves name', () => {
    const result = holidayDTO.createCustom({ ...BASE, name: 'Custom Holiday' });
    expect(result.name).toBe('Custom Holiday');
  });

  it('marks isInSelectedRange=true for a date within the year', () => {
    const result = holidayDTO.createCustom(BASE);
    expect(result.isInSelectedRange).toBe(true);
  });

  it('marks isInSelectedRange=false for a date outside the year with carryOverMonths=0', () => {
    const result = holidayDTO.createCustom({ ...BASE, date: new Date('2025-03-01') });
    expect(result.isInSelectedRange).toBe(false);
  });

  it('marks isInSelectedRange=true for a carry-over date within carryOverMonths', () => {
    const result = holidayDTO.createCustom({ ...BASE, date: new Date('2025-02-01'), carryOverMonths: 3 });
    expect(result.isInSelectedRange).toBe(true);
  });
});

describe('holidayDTO.normalize', () => {
  it('returns an empty array for empty input', () => {
    expect(holidayDTO.normalize([])).toEqual([]);
  });

  it('converts string dates to Date instances', () => {
    const holidays = [{ id: 'h1', name: 'Test', date: '2024-06-15' as unknown as Date, variant: HolidayVariant.NATIONAL, isInSelectedRange: true }] as HolidayDTO[];
    const [result] = holidayDTO.normalize(holidays);
    expect(result?.date).toBeInstanceOf(Date);
  });

  it('preserves Date instances unchanged', () => {
    const date = new Date('2024-06-15');
    const holidays = [{ id: 'h1', name: 'Test', date, variant: HolidayVariant.NATIONAL, isInSelectedRange: true }] as HolidayDTO[];
    const [result] = holidayDTO.normalize(holidays);
    expect(result?.date.getTime()).toBe(date.getTime());
  });

  it('preserves all other fields', () => {
    const holidays = [{ id: 'h1', name: 'Test', date: new Date('2024-06-15'), variant: HolidayVariant.REGIONAL, location: 'CAT', isInSelectedRange: false }] as HolidayDTO[];
    const [result] = holidayDTO.normalize(holidays);
    expect(result?.id).toBe('h1');
    expect(result?.location).toBe('CAT');
    expect(result?.isInSelectedRange).toBe(false);
  });
});
