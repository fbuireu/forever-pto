import { ES } from '../../infrastructure/i18n/locales';
import { routing } from '../../infrastructure/i18n/routing';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(),
}));

vi.mock('@ui/modules/pages/not-found/NotFoundContent', () => ({
  NotFoundContent: vi.fn().mockReturnValue(null),
}));

const { default: NotFound } = await import('./not-found');
const { getLocale } = await import('next-intl/server');

vi.mocked(getLocale).mockResolvedValue(routing.defaultLocale);

describe('not-found', () => {
  it('renders NotFoundContent with the locale from getLocale', async () => {
    const element = await NotFound();
    expect(element.props.locale).toBe(routing.defaultLocale);
  });

  it('propagates a different locale when getLocale returns it', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(ES);
    const element = await NotFound();
    expect(element.props.locale).toBe(ES);
  });
});
