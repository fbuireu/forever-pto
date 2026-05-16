import { LOCALES } from '@infrastructure/i18n/locales';
import { routing } from '@infrastructure/i18n/routing';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
  }),
}));

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const { default: sitemap } = await import('./sitemap');

const ROUTES_COUNT = 2;

describe('sitemap', () => {
  it('returns an entry for each locale × route', async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(LOCALES.length * ROUTES_COUNT);
  });

  it('omits locale prefix for the default locale (en)', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(`${BASE_URL}/`);
    expect(urls).toContain(`${BASE_URL}/planner`);
    expect(urls).not.toContain(expect.stringContaining(`/${routing.defaultLocale}`));
  });

  it('includes locale prefix for non-default locales', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const nonDefaultLocales = LOCALES.filter((l) => l !== routing.defaultLocale);
    for (const locale of nonDefaultLocales) {
      expect(urls).toContain(`${BASE_URL}/${locale}`);
      expect(urls).toContain(`${BASE_URL}/${locale}/planner`);
    }
  });

  it('sets correct changeFrequency and priority per route', async () => {
    const entries = await sitemap();

    const home = entries.find((e) => e.url === `${BASE_URL}/`);
    expect(home?.changeFrequency).toBe('monthly');
    expect(home?.priority).toBe(1);

    const planner = entries.find((e) => e.url === `${BASE_URL}/planner`);
    expect(planner?.changeFrequency).toBe('weekly');
    expect(planner?.priority).toBe(0.9);
  });

  it('sets lastModified as a Date', async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
