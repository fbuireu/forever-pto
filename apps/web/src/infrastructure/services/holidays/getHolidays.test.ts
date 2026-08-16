import type { RawHoliday } from '@application/dto/holiday/types';
import { EN } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixtureHolidaySource } from './source/fixture';
import type { HolidaySource } from './source/types';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

const { getHolidays } = await import('./getHolidays');

const raw = (date: string, name: string, type = 'public') => ({ date, name, type }) as RawHoliday;

const CALENDAR = {
  national: [
    raw('2027-01-01 00:00:00', 'New Year'),
    raw('2027-10-11 00:00:00', 'Columbus Day'),
    raw('2027-02-14 00:00:00', "Valentine's Day", 'observance'),
    raw('2027-07-04 00:00:00', 'Independence Day', 'bank'),
  ],
  regional: {
    CA: [raw('2027-01-01 00:00:00', 'New Year'), raw('2027-03-31 00:00:00', 'Cesar Chavez Day')],
  },
  regions: { US: { CA: 'California' } },
};

const BASE_PARAMS = {
  year: 2027,
  country: 'US',
  region: '',
  locale: EN,
  carryOverMonths: 1,
  source: createFixtureHolidaySource(CALENDAR),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getHolidays', () => {
  it('returns an empty calendar when no Country has been chosen yet', async () => {
    expect(await getHolidays({ ...BASE_PARAMS, country: undefined })).toEqual([]);
  });

  it('maps the source through the DTO into the glossary shape', async () => {
    const holidays = await getHolidays(BASE_PARAMS);

    expect(holidays.map(({ name }) => name)).toEqual(['New Year', 'Independence Day', 'Columbus Day']);
    expect(holidays[0].variant).toBe('national');
    expect(holidays[0].date).toBeInstanceOf(Date);
  });

  it('drops a National Holiday the selected Region does not observe', async () => {
    const holidays = await getHolidays({ ...BASE_PARAMS, region: 'CA' });

    expect(holidays.map(({ name }) => name)).not.toContain('Columbus Day');
    expect(holidays.map(({ name }) => name)).toContain('Cesar Chavez Day');
  });

  it('keeps only the classifications that mean the office is shut', async () => {
    const names = (await getHolidays(BASE_PARAMS)).map(({ name }) => name);

    expect(names).toContain('Independence Day');
    expect(names).not.toContain("Valentine's Day");
  });

  it('stamps the Region onto the regional entries, which the fixture never says itself', async () => {
    const holidays = await getHolidays({ ...BASE_PARAMS, region: 'CA' });
    const regional = holidays.find(({ name }) => name === 'Cesar Chavez Day');

    expect(regional?.variant).toBe('regional');
  });

  it('resolves the Region label from the same source, with no caller supplying one', async () => {
    const holidays = await getHolidays({ ...BASE_PARAMS, region: 'CA' });
    const regional = holidays.find(({ name }) => name === 'Cesar Chavez Day');

    expect(regional?.location).toBe('California');
  });

  it('keeps the National entry when both lookups name the same date', async () => {
    const holidays = await getHolidays({ ...BASE_PARAMS, region: 'CA' });
    const newYear = holidays.find(({ name }) => name === 'New Year');

    expect(newYear?.variant).toBe('national');
  });

  it('returns an empty calendar and logs when the source throws', async () => {
    const brokenSource: HolidaySource = {
      rawHolidays: () => {
        throw new Error('date-holidays failure');
      },
      regionsOf: () => null,
    };

    const holidays = await getHolidays({ ...BASE_PARAMS, source: brokenSource });

    expect(holidays).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith('Error in getHolidays', expect.any(Error), {
      country: 'US',
      region: '',
      year: 2027,
    });
  });
});
