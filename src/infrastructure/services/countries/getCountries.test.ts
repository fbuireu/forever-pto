import { CA, DE, EN, ES, FR, IT } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockGetNames, mockRegisterLocale } = vi.hoisted(() => ({
  mockGetNames: vi.fn(),
  mockRegisterLocale: vi.fn(),
}));
const { mockCountryDTOCreate } = vi.hoisted(() => ({ mockCountryDTOCreate: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

vi.mock('i18n-iso-countries', () => ({
  default: { registerLocale: mockRegisterLocale, getNames: mockGetNames },
}));

vi.mock('i18n-iso-countries/langs/ca.json', () => ({ default: { locale: 'ca' } }));
vi.mock('i18n-iso-countries/langs/de.json', () => ({ default: { locale: 'de' } }));
vi.mock('i18n-iso-countries/langs/en.json', () => ({ default: { locale: 'en' } }));
vi.mock('i18n-iso-countries/langs/es.json', () => ({ default: { locale: 'es' } }));
vi.mock('i18n-iso-countries/langs/fr.json', () => ({ default: { locale: 'fr' } }));
vi.mock('i18n-iso-countries/langs/it.json', () => ({ default: { locale: 'it' } }));

vi.mock('@application/dto/country/dto', () => ({
  countryDTO: { create: mockCountryDTOCreate },
}));

const { getCountries } = await import('./getCountries');

beforeEach(() => {
  mockGetNames.mockReset();
  mockCountryDTOCreate.mockReset();
  mockLogError.mockReset();
});

describe('locale registration', () => {
  it('registers all 6 locales at module load', () => {
    expect(mockRegisterLocale).toHaveBeenCalledTimes(6);
  });

  it('registers ca, de, en, es, fr and it locales', () => {
    const registeredLocales = mockRegisterLocale.mock.calls.map((call) => (call[0] as { locale: string }).locale);
    expect(registeredLocales).toEqual(expect.arrayContaining([CA, DE, EN, ES, FR, IT]));
  });
});

describe('getCountries', () => {
  it('returns country DTOs sorted alphabetically by label', () => {
    const raw = { US: 'United States', ES: 'Spain', FR: 'France' };
    mockGetNames.mockReturnValue(raw);
    mockCountryDTOCreate.mockReturnValue([
      { value: 'US', label: 'United States', flag: '🇺🇸' },
      { value: 'ES', label: 'Spain', flag: '🇪🇸' },
      { value: 'FR', label: 'France', flag: '🇫🇷' },
    ]);

    const result = getCountries(EN);

    expect(mockGetNames).toHaveBeenCalledWith(EN);
    expect(mockCountryDTOCreate).toHaveBeenCalledWith({ raw });
    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('France');
    expect(result[1].label).toBe('Spain');
    expect(result[2].label).toBe('United States');
  });

  it('returns empty array and logs error when getNames throws', () => {
    mockGetNames.mockImplementation(() => {
      throw new Error('unsupported locale');
    });

    const result = getCountries('xx');

    expect(result).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith('Error in getCountries', expect.any(Error), { locale: 'xx' });
  });

  it('returns empty array and logs error when countryDTO.create throws', () => {
    mockGetNames.mockReturnValue({ US: 'United States' });
    mockCountryDTOCreate.mockImplementation(() => {
      throw new Error('dto error');
    });

    const result = getCountries('en');

    expect(result).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith('Error in getCountries', expect.any(Error), { locale: 'en' });
  });
});
