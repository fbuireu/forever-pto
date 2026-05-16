import { EN, ES } from '@infrastructure/i18n/locales';
import { describe, expect, it, vi } from 'vitest';

const CANONICAL_PATH = '/planner';

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

describe('planner generateMetadata', () => {
  it('uses translations for title and description', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.title).toBe('t:planner.title');
    expect(meta.description).toBe('t:planner.description');
  });

  it('sets metadataBase to the site URL', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.metadataBase?.toString()).toBe(`${SITE_URL}/`);
  });

  it('enables robots indexing', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it('sets googleBot rich result directives', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.robots).toMatchObject({
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    });
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

  it('sets twitter card to summary_large_image', async () => {
    const meta = await generateMetadata(makeParams());
    expect((meta.twitter as { card?: string })?.card).toBe('summary_large_image');
  });

  it('includes openGraph image', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.openGraph?.images).toBeDefined();
  });
});
