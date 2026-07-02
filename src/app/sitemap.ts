import { LOCALES } from '@infrastructure/i18n/locales';
import { localePath } from '@infrastructure/i18n/utils/url';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { MetadataRoute } from 'next';

type Route = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'> & { path: string };

const ROUTES: Route[] = [
  { path: '', changeFrequency: 'monthly', priority: 1 },
  { path: '/planner', changeFrequency: 'weekly', priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl: baseUrl } = await getPublicEnv();

  return LOCALES.flatMap((locale) =>
    ROUTES.map(({ path, changeFrequency, priority }) => {
      return { url: `${baseUrl}${localePath(locale, path)}`, lastModified: new Date(), changeFrequency, priority };
    })
  );
}
