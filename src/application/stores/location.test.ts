import type { CountryDTO } from '@application/dto/country/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocationStore } from './location';

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: vi.fn(), warn: vi.fn() }),
}));

vi.mock('./crypto', () => ({
  encryptedStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@infrastructure/services/countries/getCountries', () => ({
  getCountries: vi.fn().mockReturnValue([]),
}));

vi.mock('@infrastructure/services/regions/getRegions', () => ({
  getRegions: vi.fn().mockReturnValue([]),
}));

const INITIAL = {
  countries: [],
  countriesLoading: false,
  countriesLastFetched: 0,
  regions: [],
  regionsLoading: false,
};

const MOCK_COUNTRIES: CountryDTO[] = [
  { value: 'ES', label: 'Spain', flag: 'es' },
  { value: 'FR', label: 'France', flag: 'fr' },
];

beforeEach(() => {
  useLocationStore.setState(INITIAL);
  vi.clearAllMocks();
});

describe('setCountries', () => {
  it('sets countries and updates timestamp', () => {
    const before = Date.now();
    useLocationStore.getState().setCountries(MOCK_COUNTRIES);
    const state = useLocationStore.getState();
    expect(state.countries).toEqual(MOCK_COUNTRIES);
    expect(state.countriesLoading).toBe(false);
    expect(state.countriesLastFetched).toBeGreaterThanOrEqual(before);
  });
});

describe('getCountryByCode', () => {
  beforeEach(() => {
    useLocationStore.setState({ countries: MOCK_COUNTRIES });
  });

  it('finds a country by exact code', () => {
    expect(useLocationStore.getState().getCountryByCode('ES')).toEqual(MOCK_COUNTRIES[0]);
  });

  it('is case-insensitive', () => {
    expect(useLocationStore.getState().getCountryByCode('es')).toEqual(MOCK_COUNTRIES[0]);
    expect(useLocationStore.getState().getCountryByCode('FR')).toEqual(MOCK_COUNTRIES[1]);
  });

  it('returns undefined for unknown code', () => {
    expect(useLocationStore.getState().getCountryByCode('XX')).toBeUndefined();
  });
});

describe('fetchRegions', () => {
  it('sets regions from getRegions synchronously', async () => {
    const { getRegions } = await import('@infrastructure/services/regions/getRegions');
    const MOCK_REGIONS = [{ value: 'CAT', label: 'Catalonia' }];
    vi.mocked(getRegions).mockReturnValueOnce(MOCK_REGIONS);

    useLocationStore.getState().fetchRegions('ES');
    const state = useLocationStore.getState();
    expect(getRegions).toHaveBeenCalledWith('ES');
    expect(state.regions).toEqual(MOCK_REGIONS);
    expect(state.regionsLoading).toBe(false);
  });
});

describe('fetchCountries', () => {
  it('fetches and stores countries', async () => {
    const { getCountries } = await import('@infrastructure/services/countries/getCountries');
    vi.mocked(getCountries).mockReturnValueOnce(MOCK_COUNTRIES);

    await useLocationStore.getState().fetchCountries('en');
    const state = useLocationStore.getState();
    expect(state.countries).toEqual(MOCK_COUNTRIES);
    expect(state.countriesLoading).toBe(false);
    expect(state.countriesLastFetched).toBeGreaterThan(0);
  });

  it('skips fetch when data was fetched within 24h', async () => {
    const { getCountries } = await import('@infrastructure/services/countries/getCountries');
    useLocationStore.setState({ countriesLastFetched: Date.now() });

    await useLocationStore.getState().fetchCountries('en');
    expect(getCountries).not.toHaveBeenCalled();
  });

  it('fetches again when last fetch was more than 24h ago', async () => {
    const { getCountries } = await import('@infrastructure/services/countries/getCountries');
    vi.mocked(getCountries).mockReturnValueOnce(MOCK_COUNTRIES);
    useLocationStore.setState({ countriesLastFetched: Date.now() - 25 * 60 * 60 * 1000 });

    await useLocationStore.getState().fetchCountries('en');
    expect(getCountries).toHaveBeenCalledOnce();
  });

  it('sets loading to false on error', async () => {
    const { getCountries } = await import('@infrastructure/services/countries/getCountries');
    vi.mocked(getCountries).mockImplementationOnce(() => { throw new Error('network error'); });
    useLocationStore.setState({ countriesLastFetched: 0 });

    await useLocationStore.getState().fetchCountries('en');
    expect(useLocationStore.getState().countriesLoading).toBe(false);
  });
});
