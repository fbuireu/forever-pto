import { describe, expect, it } from 'vitest';
import { EN, LOCALES } from './locales';
import { routing } from './routing';

describe('routing', () => {
  it('has EN as the default locale', () => {
    expect(routing.defaultLocale).toBe(EN);
  });

  it('includes all supported locales', () => {
    expect(routing.locales).toEqual(LOCALES);
  });

  it('uses "as-needed" locale prefix', () => {
    expect(routing.localePrefix).toBe('as-needed');
  });

  it('configures the locale cookie as secure with sameSite lax', () => {
    expect(routing.localeCookie).toMatchObject({ secure: true, sameSite: 'lax' });
  });
});
