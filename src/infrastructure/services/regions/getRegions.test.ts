import { ES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockGetStates, MockHolidays } = vi.hoisted(() => {
  const mockGetStates = vi.fn();
  // biome-ignore lint/complexity/useArrowFunction: called with `new`; arrow fn doesn't return the instance correctly
  const MockHolidays = vi.fn().mockImplementation(function () {
    return { getStates: mockGetStates };
  });
  return { mockGetStates, MockHolidays };
});
const { mockRegionDTOCreate } = vi.hoisted(() => ({ mockRegionDTOCreate: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

vi.mock('date-holidays', () => ({ default: MockHolidays }));

vi.mock('@application/dto/region/dto', () => ({
  regionDTO: { create: mockRegionDTOCreate },
}));

const { getRegions } = await import('./getRegions');

beforeEach(() => {
  vi.clearAllMocks();
  mockRegionDTOCreate.mockReturnValue([]);
});

describe('getRegions', () => {
  it('returns empty array when no countryCode is provided', () => {
    expect(getRegions()).toEqual([]);
    expect(MockHolidays).not.toHaveBeenCalled();
  });

  it('returns empty array when getStates returns null', () => {
    mockGetStates.mockReturnValue(null);

    expect(getRegions(ES)).toEqual([]);
  });

  it('returns empty array when getStates returns an empty object', () => {
    mockGetStates.mockReturnValue({});

    expect(getRegions(ES)).toEqual([]);
  });

  it('passes countryCode to Holidays constructor', () => {
    mockGetStates.mockReturnValue({ CAT: 'Catalonia' });
    mockRegionDTOCreate.mockReturnValue([{ value: 'CAT', label: 'Catalonia' }]);

    getRegions(ES);

    expect(MockHolidays).toHaveBeenCalledWith(ES);
  });

  it('calls getStates with lowercased countryCode', () => {
    mockGetStates.mockReturnValue({ CAT: 'Catalonia' });
    mockRegionDTOCreate.mockReturnValue([{ value: 'CAT', label: 'Catalonia' }]);

    getRegions(ES);

    expect(mockGetStates).toHaveBeenCalledWith(ES);
  });

  it('passes raw regions to regionDTO.create', () => {
    const raw = { CAT: 'Catalonia', MAD: 'Madrid' };
    mockGetStates.mockReturnValue(raw);
    mockRegionDTOCreate.mockReturnValue([
      { value: 'CAT', label: 'Catalonia' },
      { value: 'MAD', label: 'Madrid' },
    ]);

    getRegions(ES);

    expect(mockRegionDTOCreate).toHaveBeenCalledWith({ raw });
  });

  it('returns regions sorted alphabetically by label', () => {
    mockGetStates.mockReturnValue({ MAD: 'Madrid', CAT: 'Catalonia', AND: 'Andalucia' });
    mockRegionDTOCreate.mockReturnValue([
      { value: 'MAD', label: 'Madrid' },
      { value: 'CAT', label: 'Catalonia' },
      { value: 'AND', label: 'Andalucia' },
    ]);

    const result = getRegions(ES);

    expect(result[0].label).toBe('Andalucia');
    expect(result[1].label).toBe('Catalonia');
    expect(result[2].label).toBe('Madrid');
  });

  it('returns empty array and logs error when an exception is thrown', () => {
    mockGetStates.mockImplementation(() => {
      throw new Error('holidays failure');
    });

    const result = getRegions(ES);

    expect(result).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith('Error in getRegions', expect.any(Error), { countryCode: ES });
  });
});
