import { LOCALES } from '@infrastructure/i18n/locales';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `label:${key}`,
}));

const { useLanguages } = await import('./useLanguages');

describe('useLanguages', () => {
  it('returns one entry per locale', () => {
    const { result } = renderHook(() => useLanguages());
    expect(result.current).toHaveLength(LOCALES.length);
  });

  it('each entry has a code matching the locale', () => {
    const { result } = renderHook(() => useLanguages());
    const codes = result.current.map((l) => l.code);
    expect(codes).toEqual(LOCALES);
  });

  it('each entry has a label from the translations', () => {
    const { result } = renderHook(() => useLanguages());
    for (const { code, label } of result.current) {
      expect(label).toBe(`label:${code}`);
    }
  });
});
