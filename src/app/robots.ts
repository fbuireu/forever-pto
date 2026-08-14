import { LOCALES } from '@infrastructure/i18n/locales';
import { localePath } from '@infrastructure/i18n/utils/url';
import { privateRoutes } from '@infrastructure/seo/routes';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl: baseUrl } = await getPublicEnv();

  const disallow = [
    '/_next/static/',
    ...LOCALES.flatMap((locale) => privateRoutes().map(({ path }) => localePath(locale, path))),
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
