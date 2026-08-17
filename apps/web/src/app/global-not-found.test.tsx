import { routing } from '@infrastructure/i18n/routing';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHeaders, mockCookies, mockGetTranslations, mockSetRequestLocale } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockCookies: vi.fn(),
  mockGetTranslations: vi.fn(),
  mockSetRequestLocale: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: mockHeaders, cookies: mockCookies }));
vi.mock('next-intl/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl/server')>();
  return { ...actual, getTranslations: mockGetTranslations, setRequestLocale: mockSetRequestLocale };
});
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, NextIntlClientProvider: ({ children }: { children: ReactNode }) => children };
});
vi.mock('@ui/modules/core/animate/providers/LazyMotionProvider', () => ({
  LazyMotionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@ui/modules/providers/AppThemeProvider', () => ({
  AppThemeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@ui/modules/pages/not-found/HtmlLangSync', () => ({ HtmlLangSync: vi.fn().mockReturnValue(null) }));
vi.mock('@ui/modules/pages/not-found/NotFoundContent', () => ({ NotFoundContent: vi.fn().mockReturnValue(null) }));
vi.mock('@app/fonts', () => ({
  DOCUMENT_BODY_CLASS: 'bricolage-var space-grotesk-var instrument-serif-var jetbrains-mono-var font-sans antialiased',
}));
vi.mock('@styles/index.css', () => ({}));

const { default: GlobalNotFound } = await import('./global-not-found');

type Signals = { intlLocale?: string; cookieLocale?: string; acceptLanguage?: string };

const request = ({ intlLocale, cookieLocale, acceptLanguage }: Signals = {}) => {
  const headerValues: Record<string, string | undefined> = {
    'x-next-intl-locale': intlLocale,
    'accept-language': acceptLanguage,
  };
  mockHeaders.mockResolvedValue({ get: (name: string) => headerValues[name] ?? null });
  mockCookies.mockResolvedValue({ get: () => (cookieLocale ? { value: cookieLocale } : undefined) });
};

const resolveLocale = async () => {
  const suspense = GlobalNotFound().props.children.props.children;
  const localized = suspense.props.children;
  await localized.type(localized.props);
  return mockSetRequestLocale.mock.calls.at(-1)?.[0];
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTranslations.mockResolvedValue((key: string) => key);
  request();
});

describe('global-not-found', () => {
  it('renders its own document, because it replaces the root layout', () => {
    const element = GlobalNotFound();
    const body = element.props.children;
    expect(element.type).toBe('html');
    expect(body.type).toBe('body');
    expect(body.props.className).toContain('bricolage-var');
    expect(String(body.props.children.type)).toContain('react.suspense');
  });

  it('declares the default locale on <html lang>, which HtmlLangSync corrects on the client', () => {
    expect(GlobalNotFound().props.lang).toBe(routing.defaultLocale);
  });
});

describe('global-not-found locale detection', () => {
  it('prefers the x-next-intl-locale header', async () => {
    request({ intlLocale: 'de', cookieLocale: 'fr', acceptLanguage: 'it' });
    expect(await resolveLocale()).toBe('de');
  });

  it('falls back to the locale cookie when the header is absent', async () => {
    request({ cookieLocale: 'fr', acceptLanguage: 'it' });
    expect(await resolveLocale()).toBe('fr');
  });

  it('falls back to Accept-Language, stripping quality and region subtags', async () => {
    request({ acceptLanguage: 'pt-BR;q=0.9,CA-ES;q=0.8' });
    expect(await resolveLocale()).toBe('ca');
  });

  it('falls back to the default locale when nothing matches', async () => {
    request({ intlLocale: 'zz', cookieLocale: 'qq', acceptLanguage: 'ja,ko' });
    expect(await resolveLocale()).toBe(routing.defaultLocale);
  });

  it('translates in the locale it detected', async () => {
    request({ cookieLocale: 'es' });
    await resolveLocale();
    expect(mockGetTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'a11y' });
  });
});
