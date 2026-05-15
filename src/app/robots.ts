import { LOCALES } from '@infrastructure/i18n/config';
import { localePath } from '@infrastructure/i18n/url';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  const disallow = [
    '/_next/static/',
    ...LOCALES.flatMap((locale) => [localePath(locale, '/legal/'), localePath(locale, '/payment/')]),
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
