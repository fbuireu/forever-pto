import { LOCALES } from '@infrastructure/i18n/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { MetadataRoute } from 'next';

const ROUTES = [
  { path: '', changeFrequency: 'monthly', priority: 1 },
  { path: '/planner', changeFrequency: 'weekly', priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return LOCALES.flatMap((locale) =>
    ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))
  );
}
