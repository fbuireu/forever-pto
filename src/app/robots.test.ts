import type { MetadataRoute } from 'next';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { LOCALES } from '../infrastructure/i18n/locales';
import { localePath } from '../infrastructure/i18n/url';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: 'https://forever-pto.com' },
  }),
}));

const { default: robots, DISALLOWED_PAGES } = await import('./robots');

type UnwrapRules<T> = T extends Array<infer U> ? U : T;
type RobotsRule = UnwrapRules<MetadataRoute.Robots['rules']>;

let result: MetadataRoute.Robots;
let rule: RobotsRule;

beforeAll(async () => {
  result = await robots();
  [rule] = Array.isArray(result.rules) ? result.rules : [result.rules];
});

describe('robots', () => {
  it('returns a single wildcard rule', () => {
    expect(result.rules).toHaveLength(1);
    expect(rule).toMatchObject({ userAgent: '*', allow: '/' });
  });

  it('disallows _next/static', () => {
    expect(rule.disallow).toContain('/_next/static/');
  });

  it('disallows all pages for all locales', () => {
    for (const locale of LOCALES) {
      for (const page of DISALLOWED_PAGES) {
        expect(rule.disallow).toContain(localePath(locale, page));
      }
    }
  });

  it('includes the sitemap URL', () => {
    expect(result.sitemap).toBe('https://forever-pto.com/sitemap.xml');
  });
});
