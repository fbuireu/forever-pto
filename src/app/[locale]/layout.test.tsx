import { CA, DE, EN, ES, FR, IT, LOCALES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNotFound = vi.fn();
const mockSetRequestLocale = vi.fn();
const mockGetTranslations = vi.fn().mockResolvedValue((key: string) => key);

vi.mock('next/navigation', () => ({ notFound: mockNotFound }));
vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
  setRequestLocale: mockSetRequestLocale,
}));
vi.mock('next-intl', () => ({
  hasLocale: (locales: string[], locale: unknown) => locales.includes(locale as string),
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock('@ui/modules/providers/BonesProvider', () => ({ BonesProvider: () => null }));
vi.mock('@ui/modules/shared/cookie-consent/CookieConsentClient', () => ({ CookieConsentClient: () => null }));
vi.mock('@ui/modules/shared/WebMCP', () => ({ WebMCP: () => null }));
vi.mock('@ui/modules/tutorial/Analytics', () => ({ Analytics: () => null }));
vi.mock('@ui/modules/tutorial/BetterStackTracking', () => ({ BetterStackTracking: () => null }));
vi.mock('@ui/modules/core/animate/providers/LazyMotionProvider', () => ({
  LazyMotionProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock('@ui/modules/providers/AppThemeProvider', () => ({
  AppThemeProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock('@ui/utils/cn', () => ({ cn: (...args: unknown[]) => args.filter(Boolean).join(' ') }));
vi.mock('@styles/index.css', () => ({}));
vi.mock('@app/fonts', () => ({
  bricolage: { variable: 'var-bricolage' },
  spaceGrotesk: { variable: 'var-space-grotesk' },
  instrumentSerif: { variable: 'var-instrument-serif' },
  jetbrainsMono: { variable: 'var-jetbrains-mono' },
}));

const { default: Layout, generateStaticParams } = await import('./layout');

describe('[locale]/layout', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generateStaticParams', () => {
    it('returns one entry per locale', () => {
      expect(generateStaticParams()).toHaveLength(LOCALES.length);
    });

    it('covers all supported locales', () => {
      const locales = generateStaticParams().map((p) => p.locale);
      expect(locales).toEqual(expect.arrayContaining([CA, IT, EN, ES, FR, DE]));
    });
  });

  describe('Layout', () => {
    it('calls notFound for an unrecognised locale', async () => {
      await Layout({ children: null, params: Promise.resolve({ locale: 'xx' as never }) });
      expect(mockNotFound).toHaveBeenCalledOnce();
    });

    it('does not call notFound for a valid locale', async () => {
      await Layout({ children: null, params: Promise.resolve({ locale: EN as never }) });
      expect(mockNotFound).not.toHaveBeenCalled();
    });

    it('calls setRequestLocale with the resolved locale', async () => {
      await Layout({ children: null, params: Promise.resolve({ locale: ES as never }) });
      expect(mockSetRequestLocale).toHaveBeenCalledWith(ES);
    });

    it('sets the lang attribute on the html element', async () => {
      const element = await Layout({ children: null, params: Promise.resolve({ locale: ES as never }) });
      expect(element.props.lang).toBe(ES);
    });
  });
});
