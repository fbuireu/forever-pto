import { describe, expect, it, vi } from 'vitest';

const mockUsePathname = vi.hoisted(() => vi.fn(() => '/en/planner'));
const MockErrorContent = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }));
vi.mock('@ui/modules/pages/error/ErrorContent', () => ({ ErrorContent: MockErrorContent }));
vi.mock('@ui/modules/core/animate/providers/LazyMotionProvider', () => ({
  LazyMotionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@ui/modules/providers/AppThemeProvider', () => ({
  AppThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});
vi.mock('@app/fonts', () => ({
  bricolage: { variable: 'bricolage-var' },
  spaceGrotesk: { variable: 'space-grotesk-var' },
  instrumentSerif: { variable: 'instrument-serif-var' },
  jetbrainsMono: { variable: 'jetbrains-mono-var' },
}));
vi.mock('@styles/index.css', () => ({}));

const { default: GlobalError } = await import('./global-error');

const mockError = Object.assign(new Error('catastrophic failure'), { digest: 'xyz789' });
const mockReset = vi.fn();

describe('global-error', () => {
  it('renders an html element with the detected locale', () => {
    mockUsePathname.mockReturnValue('/es/planner');
    const element = GlobalError({ error: mockError, reset: mockReset });
    expect(element.type).toBe('html');
    expect(element.props.lang).toBe('es');
  });

  it('falls back to the default locale when pathname has no locale segment', () => {
    mockUsePathname.mockReturnValue('/');
    const element = GlobalError({ error: mockError, reset: mockReset });
    expect(element.props.lang).toBe('en');
  });

  it('falls back to default locale when usePathname returns null', () => {
    mockUsePathname.mockReturnValue(null);
    const element = GlobalError({ error: mockError, reset: mockReset });
    expect(element.props.lang).toBe('en');
  });

  it('renders a body element with font variables', () => {
    mockUsePathname.mockReturnValue('/en');
    const element = GlobalError({ error: mockError, reset: mockReset });
    const body = element.props.children;
    expect(body.type).toBe('body');
    expect(body.props.className).toContain('bricolage-var');
  });

  it('forwards error and reset to ErrorContent', () => {
    mockUsePathname.mockReturnValue('/en');
    const element = GlobalError({ error: mockError, reset: mockReset });
    // html > body > NextIntlClientProvider > AppThemeProvider > LazyMotionProvider > div > ErrorContent
    const body = element.props.children;
    const nextIntl = body.props.children;
    const themeProvider = nextIntl.props.children;
    const motionProvider = themeProvider.props.children;
    const wrapper = motionProvider.props.children;
    const errorContent = wrapper.props.children;
    expect(errorContent.props.error).toBe(mockError);
    expect(errorContent.props.reset).toBe(mockReset);
  });
});
