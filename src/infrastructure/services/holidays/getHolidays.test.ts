import { EN } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockGetNationalHolidays, mockGetRegionalHolidays } = vi.hoisted(() => ({
  mockGetNationalHolidays: vi.fn().mockReturnValue([]),
  mockGetRegionalHolidays: vi.fn().mockReturnValue([]),
}));
const { mockHolidayDTOCreate } = vi.hoisted(() => ({ mockHolidayDTOCreate: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

vi.mock('./utils/holidays', () => ({
  getNationalHolidays: mockGetNationalHolidays,
  getRegionalHolidays: mockGetRegionalHolidays,
}));

vi.mock('@application/dto/holiday/dto', () => ({
  holidayDTO: { create: mockHolidayDTOCreate },
}));

const { getHolidays } = await import('./getHolidays');

const BASE_PARAMS = {
  year: 2026,
  country: 'ES',
  region: '',
  locale: EN,
  carryOverMonths: 1,
  regions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockHolidayDTOCreate.mockReturnValue([]);
});

describe('getHolidays', () => {
  it('returns empty array when no country is provided', async () => {
    const result = await getHolidays({ ...BASE_PARAMS, country: undefined });
    expect(result).toEqual([]);
    expect(mockGetNationalHolidays).not.toHaveBeenCalled();
  });

  it('calls getNationalHolidays and getRegionalHolidays with correct params', async () => {
    await getHolidays({ ...BASE_PARAMS, region: 'CAT' });
    expect(mockGetNationalHolidays).toHaveBeenCalledWith({
      country: 'ES',
      configuration: { languages: [EN] },
      year: 2026,
    });
    expect(mockGetRegionalHolidays).toHaveBeenCalledWith({
      country: 'ES',
      region: 'CAT',
      configuration: { languages: [EN] },
      year: 2026,
    });
  });

  it('passes combined raw holidays to holidayDTO.create', async () => {
    const national = [{ date: new Date('2026-01-01'), name: 'New Year', type: 'public' }];
    const regional = [{ date: new Date('2026-06-24'), name: 'Sant Joan', type: 'public' }];
    mockGetNationalHolidays.mockReturnValue(national);
    mockGetRegionalHolidays.mockReturnValue(regional);
    mockHolidayDTOCreate.mockReturnValue([]);

    await getHolidays(BASE_PARAMS);

    expect(mockHolidayDTOCreate).toHaveBeenCalledWith({
      raw: [...national, ...regional],
      params: { year: 2026, carryOverMonths: 1, regions: [] },
    });
  });

  it('returns holidays sorted by date', async () => {
    mockHolidayDTOCreate.mockReturnValue([
      { date: new Date('2026-12-25'), name: 'Christmas' },
      { date: new Date('2026-01-01'), name: 'New Year' },
    ]);

    const result = await getHolidays(BASE_PARAMS);

    expect(result[0].name).toBe('New Year');
    expect(result[1].name).toBe('Christmas');
  });

  it('returns empty array and logs error when processing throws', async () => {
    mockGetNationalHolidays.mockImplementation(() => {
      throw new Error('date-holidays failure');
    });

    const result = await getHolidays(BASE_PARAMS);

    expect(result).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith('Error in getHolidays', expect.any(Error), {
      country: 'ES',
      region: '',
      year: 2026,
    });
  });
});
