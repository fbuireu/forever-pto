import { describe, expect, it, vi } from 'vitest';
import { EN } from './locales';

let capturedCallback: ((args: { requestLocale: Promise<string | undefined> }) => Promise<unknown>) | null = null;

vi.mock('next-intl/server', () => ({
  getRequestConfig: vi.fn((cb: typeof capturedCallback) => {
    capturedCallback = cb;
    return cb;
  }),
}));

vi.mock('@i18n/messages/en.json', () => ({ default: { key: 'en-value' } }));
vi.mock('@i18n/messages/es.json', () => ({ default: { key: 'es-value' } }));
vi.mock('@i18n/messages/ca.json', () => ({ default: { key: 'ca-value' } }));
vi.mock('@i18n/messages/it.json', () => ({ default: { key: 'it-value' } }));
vi.mock('@i18n/messages/fr.json', () => ({ default: { key: 'fr-value' } }));
vi.mock('@i18n/messages/de.json', () => ({ default: { key: 'de-value' } }));

await import('./config');

const call = (requestLocale: string | undefined) =>
  capturedCallback?.({ requestLocale: Promise.resolve(requestLocale) }) as Promise<{
    locale: string;
    messages: Record<string, string>;
  }>;

describe('config', () => {
  it('uses the requested locale when it is valid', async () => {
    const result = await call('es');
    expect(result.locale).toBe('es');
  });

  it('falls back to EN for an unknown locale', async () => {
    const result = await call('xx');
    expect(result.locale).toBe(EN);
  });

  it('falls back to EN when requestLocale is undefined', async () => {
    const result = await call(undefined);
    expect(result.locale).toBe(EN);
  });

  it('loads the messages for the resolved locale', async () => {
    const result = await call('fr');
    expect(result.messages).toEqual({ key: 'fr-value' });
  });

  it('loads EN messages when falling back to the default locale', async () => {
    const result = await call('unknown');
    expect(result.messages).toEqual({ key: 'en-value' });
  });

  it('exports LOCALE_COOKIE as "NEXT_LOCALE"', async () => {
    const { LOCALE_COOKIE } = await import('./config');
    expect(LOCALE_COOKIE).toBe('NEXT_LOCALE');
  });

  it('re-exports LOCALES from locales.ts', async () => {
    const { LOCALES: configLocales } = await import('./config');
    const { LOCALES: sourceLocales } = await import('./locales');
    expect(configLocales).toEqual(sourceLocales);
  });
});
