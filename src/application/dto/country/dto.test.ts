import { describe, expect, it } from 'vitest';
import { countryDTO } from './dto';

describe('countryDTO', () => {
  it('returns an empty array for an empty raw object', () => {
    expect(countryDTO.create({ raw: {} })).toEqual([]);
  });

  it('maps a single entry to a CountryDTO with value, label and flag', () => {
    const result = countryDTO.create({ raw: { US: 'United States' } });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ value: 'US', label: 'United States' });
    expect(result[0]?.flag).toBe('us');
  });

  it('maps all entries preserving their codes as value', () => {
    const result = countryDTO.create({ raw: { US: 'United States', ES: 'Spain', FR: 'France' } });

    expect(result).toHaveLength(3);
    const codes = result.map((c) => c.value);
    expect(codes).toContain('US');
    expect(codes).toContain('ES');
    expect(codes).toContain('FR');
  });

  it('generates a flag for every entry', () => {
    const result = countryDTO.create({ raw: { DE: 'Germany', IT: 'Italy' } });
    expect(result.every((c) => c.flag.length > 0)).toBe(true);
  });
});
