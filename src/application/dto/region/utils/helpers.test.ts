import { describe, expect, it } from 'vitest';
import { getRegionName } from './helpers';

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
