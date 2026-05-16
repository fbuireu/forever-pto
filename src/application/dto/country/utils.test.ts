import { describe, expect, it } from 'vitest';
import { getEmojiFlag } from './utils';

describe('getEmojiFlag', () => {
  it('returns the correct emoji for a known uppercase code', () => {
    expect(getEmojiFlag('US')).toBe('🇺🇸');
    expect(getEmojiFlag('ES')).toBe('🇪🇸');
    expect(getEmojiFlag('FR')).toBe('🇫🇷');
  });

  it('is case-insensitive', () => {
    expect(getEmojiFlag('us')).toBe(getEmojiFlag('US'));
    expect(getEmojiFlag('es')).toBe(getEmojiFlag('ES'));
  });

  it('returns empty string for empty input', () => {
    expect(getEmojiFlag('')).toBe('');
  });
});
