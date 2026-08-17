import { describe, expect, it } from 'vitest';
import { buildMetadata } from './buildMetadata';

const NOINDEX_ROUTE = '/legal/legal-notice';

const BASE = {
  baseUrl: 'https://forever-pto.com',
  locale: 'en' as const,
  route: '/planner',
  title: 'Planner',
  description: 'Plan your days off',
};

describe('buildMetadata', () => {
  it('advertises an Open Graph image and a Twitter card on an indexable page with a description', () => {
    const metadata = buildMetadata(BASE);
    expect(metadata.openGraph?.images).toHaveLength(1);
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'Planner' });
  });

  it('withholds both from a noindex page, so a legal notice advertises no card', () => {
    const metadata = buildMetadata({ ...BASE, route: NOINDEX_ROUTE });
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });

  it('reads indexability off the route table, so no caller can contradict it', () => {
    expect(buildMetadata({ ...BASE, route: NOINDEX_ROUTE, keywords: 'pto' }).keywords).toBeUndefined();
    expect(buildMetadata({ ...BASE, route: '/not-in-the-table' }).robots).toEqual({ index: false, follow: false });
  });

  it('withholds the whole Open Graph block, and the card with it, when there is no description', () => {
    const metadata = buildMetadata({ ...BASE, description: undefined });
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
    expect(metadata.description).toBeUndefined();
  });

  it('flips the robots block on indexable, googleBot directives included', () => {
    expect(buildMetadata(BASE).robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    });
    expect(buildMetadata({ ...BASE, route: NOINDEX_ROUTE }).robots).toEqual({ index: false, follow: false });
  });

  it('canonicalises against the locale-prefixed path and lists every locale alternate', () => {
    const { alternates } = buildMetadata({ ...BASE, locale: 'es' });
    expect(alternates?.canonical).toBe('/es/planner');
    expect(Object.keys(alternates?.languages ?? {}).length).toBeGreaterThan(1);
  });

  it('omits keywords rather than emitting an empty tag when none are given', () => {
    expect(buildMetadata(BASE).keywords).toBeUndefined();
    expect(buildMetadata({ ...BASE, keywords: 'pto, holidays' }).keywords).toBe('pto, holidays');
  });
});
