import { EN, ES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetRequestLocale = vi.fn();
const MockHeader = vi.fn().mockReturnValue(null);
const MockFooter = vi.fn().mockReturnValue(null);
const MockToaster = vi.fn().mockReturnValue(null);

vi.mock('next-intl/server', () => ({ setRequestLocale: mockSetRequestLocale }));
vi.mock('@ui/modules/pages/homepage/navigation/Navigation', () => ({ Header: MockHeader }));
vi.mock('@ui/modules/shared/footer/Footer', () => ({ Footer: MockFooter }));
vi.mock('@ui/modules/core/primitives/Sonner', () => ({ Toaster: MockToaster }));

const { default: MarketingLayout } = await import('./layout');

describe('(marketing)/layout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls setRequestLocale with the resolved locale', async () => {
    await MarketingLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    expect(mockSetRequestLocale).toHaveBeenCalledWith(EN);
  });

  it('renders a min-h-screen wrapper div', async () => {
    const element = await MarketingLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    expect(element.type).toBe('div');
    expect(element.props.className).toContain('min-h-screen');
  });

  it('renders children inside the wrapper', async () => {
    const child = 'test-child';
    const element = await MarketingLayout({ children: child, params: Promise.resolve({ locale: ES as never }) });
    expect(element.props.children).toContain(child);
  });

  it('includes Header in the layout', async () => {
    const element = await MarketingLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    const children: unknown[] = [element.props.children].flat();
    expect(children.some((c: unknown) => (c as { type?: unknown })?.type === MockHeader)).toBe(true);
  });

  it('includes Footer in the layout', async () => {
    const element = await MarketingLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    const children: unknown[] = [element.props.children].flat();
    expect(children.some((c: unknown) => (c as { type?: unknown })?.type === MockFooter)).toBe(true);
  });

  it('includes Toaster in the layout', async () => {
    const element = await MarketingLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    const children: unknown[] = [element.props.children].flat();
    expect(children.some((c: unknown) => (c as { type?: unknown })?.type === MockToaster)).toBe(true);
  });
});
