import { LOCALES } from '@infrastructure/i18n/locales';
import { localePath } from '@infrastructure/i18n/utils/url';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { MetadataRoute } from 'next';

export const DISALLOWED_PAGES = ['/legal/', '/payment/'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  const disallow = [
    '/_next/static/',
    ...LOCALES.flatMap((locale) => DISALLOWED_PAGES.map((page) => localePath(locale, page))),
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
