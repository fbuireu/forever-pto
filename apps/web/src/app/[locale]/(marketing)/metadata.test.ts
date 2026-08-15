import { LOCALES } from '@infrastructure/i18n/locales';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
  }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => `t:${key}`),
}));

const { generateMetadata } = await import('./metadata');

const makeParams = (locale = 'en') => ({ params: Promise.resolve({ locale }) });

describe('(marketing) generateMetadata', () => {
  it('uses translations for title and description', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.title).toBe('t:title');
    expect(meta.description).toBe('t:description');
  });

  it('sets metadataBase to the site URL', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.metadataBase?.toString()).toBe(`${process.env.NEXT_PUBLIC_SITE_URL}/`);
  });

  it('sets openGraph title, description, siteName and type', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.openGraph?.title).toBe('t:title');
    expect(meta.openGraph?.description).toBe('t:description');
    expect(meta.openGraph?.siteName).toBe('Forever PTO');
    expect((meta.openGraph as { type?: string })?.type).toBe('website');
  });

  it('sets openGraph locale from params', async () => {
    const meta = await generateMetadata(makeParams('es'));
    expect(meta.openGraph?.locale).toBe('es');
  });

  it('sets twitter card to summary_large_image', async () => {
    const meta = await generateMetadata(makeParams());
    expect((meta.twitter as { card?: string })?.card).toBe('summary_large_image');
  });

  it('enables robots indexing', async () => {
    const meta = await generateMetadata(makeParams());
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it('includes canonical alternate', async () => {
    const meta = await generateMetadata(makeParams('en'));
    expect(meta.alternates?.canonical).toBeDefined();
  });

  it('includes language alternates for all locales', async () => {
    const meta = await generateMetadata(makeParams('en'));
    for (const locale of LOCALES) {
      expect(meta.alternates?.languages).toHaveProperty(locale);
    }
  });
});
