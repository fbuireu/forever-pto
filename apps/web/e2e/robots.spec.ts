import { expect, test } from '@playwright/test';
import { LOCALES } from 'src/infrastructure/i18n/locales';
import { localePath } from 'src/infrastructure/i18n/utils/url';

const ROBOTS_URL = '/robots.txt';

test.describe('robots.txt', () => {
  test('returns 200 with correct content-type', async ({ request }) => {
    const response = await request.get(ROBOTS_URL);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
  });

  test('allows all crawlers at root', async ({ request }) => {
    const body = await (await request.get(ROBOTS_URL)).text();
    expect(body).toMatch(/^User-agent:\s*\*/im);
    expect(body).toMatch(/^Allow:\s*\//im);
  });

  test('disallows _next/static', async ({ request }) => {
    const body = await (await request.get(ROBOTS_URL)).text();
    expect(body).toContain('Disallow: /_next/static/');
  });

  test('disallows legal and payment paths for all locales', async ({ request }) => {
    const body = await (await request.get(ROBOTS_URL)).text();
    for (const locale of LOCALES) {
      expect(body).toContain(`Disallow: ${localePath(locale, '/legal/')}`);
      expect(body).toContain(`Disallow: ${localePath(locale, '/payment/')}`);
    }
  });

  test('includes sitemap URL', async ({ request }) => {
    const body = await (await request.get(ROBOTS_URL)).text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });
});
