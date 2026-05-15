import { describe, expect, it, vi } from 'vitest';
import { LOCALES } from '../infrastructure/i18n/locales';
import { routing } from '../infrastructure/i18n/routing';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: 'https://forever-pto.com' },
  }),
}));

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

    expect(urls).toContain('https://forever-pto.com/');
    expect(urls).toContain('https://forever-pto.com/planner');
    expect(urls).not.toContain(expect.stringContaining(`/${routing.defaultLocale}`));
  });

  it('includes locale prefix for non-default locales', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const nonDefaultLocales = LOCALES.filter((l) => l !== routing.defaultLocale);
    for (const locale of nonDefaultLocales) {
      expect(urls).toContain(`https://forever-pto.com/${locale}`);
      expect(urls).toContain(`https://forever-pto.com/${locale}/planner`);
    }
  });

  it('sets correct changeFrequency and priority per route', async () => {
    const entries = await sitemap();

    const home = entries.find((e) => e.url === 'https://forever-pto.com/');
    expect(home?.changeFrequency).toBe('monthly');
    expect(home?.priority).toBe(1);

    const planner = entries.find((e) => e.url === 'https://forever-pto.com/planner');
    expect(planner?.changeFrequency).toBe('weekly');
    expect(planner?.priority).toBe(0.9);
  });

  it('sets lastModified as a Date', async () => {
    const entries = await sitemap();
    entries.forEach((entry) => expect(entry.lastModified).toBeInstanceOf(Date));
  });
});
