import { describe, expect, it } from 'vitest';
import { getFlagCode } from './flag';

describe('getFlagCode', () => {
  it('returns lowercase country code', () => {
    expect(getFlagCode('US')).toBe('us');
    expect(getFlagCode('ES')).toBe('es');
    expect(getFlagCode('FR')).toBe('fr');
  });

  it('is case-insensitive', () => {
    expect(getFlagCode('us')).toBe(getFlagCode('US'));
    expect(getFlagCode('es')).toBe(getFlagCode('ES'));
  });

  it('returns empty string for empty input', () => {
    expect(getFlagCode('')).toBe('');
  });
});
