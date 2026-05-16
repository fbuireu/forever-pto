import { EN, ES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const NAMESPACE = 'legalNotice';
const ENV = { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CONTACT_EMAIL: 'test@test.com' };

const mockGetCloudflareContext = vi.fn();
const MockLegalLayout = vi.fn().mockReturnValue(null);
const mockGetTranslations = vi.fn();
const mockCreateRichLink = vi.fn().mockReturnValue(vi.fn().mockReturnValue(null));
const MockMe = vi.fn().mockReturnValue(null);

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock('@ui/modules/layout/LegalLayout', () => ({
  LegalLayout: MockLegalLayout,
}));

vi.mock('@ui/modules/core/primitives/RichLink', () => ({
  createRichLink: mockCreateRichLink,
}));

vi.mock('@ui/modules/pages/legal/Me', () => ({
  Me: MockMe,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));

const { default: LegalNoticePage } = await import('./page');

const makeParams = (locale = EN) => ({ params: Promise.resolve({ locale: locale as never }) });

describe('legal-notice/page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockT = Object.assign(vi.fn((key: string) => `t:${key}`), {
      rich: vi.fn().mockReturnValue(null),
    });
    mockGetTranslations.mockResolvedValue(mockT);
    mockGetCloudflareContext.mockResolvedValue({ env: ENV });
  });

  it('renders LegalLayout with translated title', async () => {
    const element = await LegalNoticePage(makeParams());
    expect(element.type).toBe(MockLegalLayout);
    expect(element.props.title).toBe('t:title');
  });

  it('calls getTranslations with the legalNotice namespace', async () => {
    await LegalNoticePage(makeParams());
    expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ namespace: NAMESPACE }));
  });

  it('passes locale to getTranslations', async () => {
    await LegalNoticePage(makeParams(ES));
    expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ locale: ES }));
  });

  it('renders lastUpdated prop', async () => {
    const element = await LegalNoticePage(makeParams());
    expect(element.props.lastUpdated).toBeDefined();
  });
});
