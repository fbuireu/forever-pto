import { LOCALES } from '@infrastructure/i18n/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return LOCALES.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));
}
