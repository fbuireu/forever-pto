import { LOCALES } from '@infrastructure/i18n/locales';
import { localePath } from '@infrastructure/i18n/utils/url';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { MetadataRoute } from 'next';

export const DISALLOWED_PAGES = ['/legal/', '/payment/'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl: baseUrl } = await getPublicEnv();

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
