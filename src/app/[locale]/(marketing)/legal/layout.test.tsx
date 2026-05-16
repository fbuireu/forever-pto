import { EN, ES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetRequestLocale = vi.fn();

vi.mock('next-intl/server', () => ({ setRequestLocale: mockSetRequestLocale }));

const { default: LegalLayout } = await import('./layout');

describe('legal/layout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders main#main-content', async () => {
    const element = await LegalLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    expect(element.type).toBe('main');
    expect(element.props.id).toBe('main-content');
  });

  it('has flex-1 class', async () => {
    const element = await LegalLayout({ children: null, params: Promise.resolve({ locale: EN as never }) });
    expect(element.props.className).toContain('flex-1');
  });

  it('calls setRequestLocale with the resolved locale', async () => {
    await LegalLayout({ children: null, params: Promise.resolve({ locale: ES as never }) });
    expect(mockSetRequestLocale).toHaveBeenCalledWith(ES);
  });

  it('renders children', async () => {
    const child = 'legal-content';
    const element = await LegalLayout({ children: child, params: Promise.resolve({ locale: EN as never }) });
    expect(element.props.children).toBe(child);
  });
});
