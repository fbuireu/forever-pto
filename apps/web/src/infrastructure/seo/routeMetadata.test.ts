import en from '@i18n/messages/en.json';
import { SITE_ROUTES } from '@infrastructure/seo/routes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetTranslations, mockGetPublicEnv } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
  mockGetPublicEnv: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getTranslations: mockGetTranslations }));
vi.mock('@infrastructure/services/env/getPublicEnv', () => ({ getPublicEnv: mockGetPublicEnv }));

const { routeMetadata } = await import('./routeMetadata');

const BASE_URL = 'https://forever-pto.com';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPublicEnv.mockResolvedValue({ siteUrl: BASE_URL });
  mockGetTranslations.mockImplementation(async ({ namespace }: { namespace: string }) => (key: string) =>
    `[${namespace}:${key}]`
  );
});

const generate = (path: string) =>
  routeMetadata(path as Parameters<typeof routeMetadata>[0])({ params: Promise.resolve({ locale: 'en' }) });

describe('routeMetadata', () => {
  it('resolves a title through the metadata namespace, using the key on that route own row', async () => {
    const meta = await generate('/legal/privacy-policy');

    expect(meta.title).toBe('[metadata:privacyPolicy.title]');
    expect(meta.description).toBe('[metadata:privacyPolicy.description]');
  });

  it('leaves the description out when the row declares none', async () => {
    const meta = await generate('/payment/confirmation');

    expect(meta.title).toBe('[metadata:paymentConfirmation.title]');
    expect(meta.description).toBeUndefined();
  });

  it('reads every title through one namespace, so no route can pick up another route copy', async () => {
    await Promise.all(SITE_ROUTES.map((route) => generate(route.path)));

    const namespaces = new Set(mockGetTranslations.mock.calls.map(([{ namespace }]) => namespace));
    expect([...namespaces]).toEqual(['metadata']);
  });

  it('carries keywords only where the route is indexable, since buildMetadata drops them otherwise', async () => {
    expect(await generate('/planner')).toHaveProperty('keywords', '[metadata:keywords]');
    expect(await generate('/legal/legal-notice')).not.toHaveProperty('keywords');
  });

  it('canonicalises against the route path the caller named', async () => {
    const meta = await generate('/planner');

    expect(meta.alternates?.canonical).toBe('/planner');
    expect(meta.metadataBase?.toString()).toBe(`${BASE_URL}/`);
  });
});

describe('the route table keys the message bundle can honour', () => {
  const metadata = en.metadata as Record<string, unknown>;
  const resolve = (key: string) => key.split('.').reduce<unknown>((node, part) => (node as never)?.[part], metadata);

  it.each(SITE_ROUTES.flatMap((route) => [route.titleKey, route.descriptionKey].filter(Boolean) as string[]))(
    'resolves %s to a real message',
    (key) => {
      expect(typeof resolve(key), key).toBe('string');
      expect(resolve(key)).not.toBe('');
    }
  );

  it('gives every route its own title key, so no page can wear another page name', () => {
    const titleKeys = SITE_ROUTES.map((route) => route.titleKey);

    expect(titleKeys).toEqual([...new Set(titleKeys)]);
  });
});
