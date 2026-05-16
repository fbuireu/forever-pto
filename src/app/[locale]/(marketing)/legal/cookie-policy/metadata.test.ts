import { EN, ES } from '@infrastructure/i18n/locales';
import { describe, expect, it, vi } from 'vitest';

const CANONICAL_PATH = '/legal/cookie-policy';

const { SITE_URL } = vi.hoisted(() => ({ SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
  }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => `t:${key}`),
}));

const { generateMetadata } = await import('./metadata');

const makeParams = (locale = EN) => ({ params: Promise.resolve({ locale }) });

describe('cookie-policy generateMetadata', () => {
  it('uses translations for title and description', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.title).toBe('t:title');
    expect(meta.description).toBe('t:description');
  });

  it('sets metadataBase to the site URL', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.metadataBase?.toString()).toBe(`${SITE_URL}/`);
  });

  it('sets robots to noindex, nofollow', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  it('canonical does not include default locale prefix', async () => {
    const meta = await generateMetadata(makeParams(EN));
    expect(meta.alternates?.canonical).toBe(CANONICAL_PATH);
  });

  it('canonical includes non-default locale prefix', async () => {
    const meta = await generateMetadata(makeParams(ES));
    expect(meta.alternates?.canonical).toBe(`/${ES}${CANONICAL_PATH}`);
  });

  it('includes language alternates', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.alternates?.languages).toBeDefined();
  });

  it('sets openGraph siteName to Forever PTO', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.openGraph?.siteName).toBe('Forever PTO');
  });

  it('sets openGraph locale from params', async () => {
    const meta = await generateMetadata(makeParams(ES));
    expect(meta.openGraph?.locale).toBe(ES);
  });
});
