import { EN } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetHolidays, MockHolidays } = vi.hoisted(() => {
  const mockGetHolidays = vi.fn();
  // biome-ignore lint/complexity/useArrowFunction: called with `new`; arrow fn doesn't return the instance correctly
  const MockHolidays = vi.fn().mockImplementation(function () {
    return { getHolidays: mockGetHolidays };
  });
  return { mockGetHolidays, MockHolidays };
});

vi.mock('date-holidays', () => ({ default: MockHolidays }));

const { getHolidaysForYears, getNationalHolidays, getRegionalHolidays } = await import('./holidays');

const YEAR = 2026;
const CURRENT_YEAR_HOLIDAYS = [{ date: new Date('2026-01-01'), name: 'New Year' }];
const NEXT_YEAR_HOLIDAYS = [{ date: new Date('2027-01-01'), name: "New Year's" }];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetHolidays.mockImplementation((year: number) =>
    year === YEAR ? CURRENT_YEAR_HOLIDAYS : NEXT_YEAR_HOLIDAYS
  );
});

describe('getHolidaysForYears', () => {
  it('fetches holidays for the given year and the following year', () => {
    const instance = new MockHolidays() as never;
    getHolidaysForYears(instance, YEAR);
    expect(mockGetHolidays).toHaveBeenCalledWith(YEAR);
    expect(mockGetHolidays).toHaveBeenCalledWith(YEAR + 1);
  });

  it('concatenates both years into a single array', () => {
    const instance = new MockHolidays() as never;
    const result = getHolidaysForYears(instance, YEAR);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(CURRENT_YEAR_HOLIDAYS[0]);
    expect(result).toContainEqual(NEXT_YEAR_HOLIDAYS[0]);
  });
});

describe('getNationalHolidays', () => {
  const PARAMS = { country: 'ES', configuration: { languages: [EN] }, year: YEAR };

  it('returns holidays for the country across two years', () => {
    const result = getNationalHolidays(PARAMS);
    expect(result).toHaveLength(2);
  });

  it('passes country and configuration to Holidays constructor', () => {
    getNationalHolidays(PARAMS);
    expect(MockHolidays).toHaveBeenCalledWith('ES', { languages: ['en'] });
  });
});

describe('getRegionalHolidays', () => {
  const PARAMS = { country: 'ES', region: 'CAT', configuration: { languages: [EN] }, year: YEAR };

  it('returns empty array when no region is provided', () => {
    expect(getRegionalHolidays({ ...PARAMS, region: undefined })).toEqual([]);
    expect(getRegionalHolidays({ ...PARAMS, region: '' })).toEqual([]);
  });

  it('returns holidays with location attached when region is provided', () => {
    const result = getRegionalHolidays(PARAMS);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ location: 'CAT' });
    expect(result[1]).toMatchObject({ location: 'CAT' });
  });

  it('passes country, region and configuration to Holidays constructor', () => {
    getRegionalHolidays(PARAMS);
    expect(MockHolidays).toHaveBeenCalledWith('ES', 'CAT', { languages: ['en'] });
  });

  it('does not call Holidays when region is absent', () => {
    getRegionalHolidays({ ...PARAMS, region: undefined });
    expect(MockHolidays).not.toHaveBeenCalled();
  });
});
