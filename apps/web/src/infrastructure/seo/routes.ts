import type { MetadataRoute } from 'next';

type SitemapHints = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>;

export interface SiteRoute extends Partial<SitemapHints> {
  path: string;
  indexable: boolean;
  titleKey: string;
  descriptionKey?: string;
}

export const SITE_ROUTES = [
  {
    path: '',
    indexable: true,
    changeFrequency: 'monthly',
    priority: 1,
    titleKey: 'title',
    descriptionKey: 'description',
  },
  {
    path: '/planner',
    indexable: true,
    changeFrequency: 'weekly',
    priority: 0.9,
    titleKey: 'planner.title',
    descriptionKey: 'planner.description',
  },
  {
    path: '/legal/cookie-policy',
    indexable: false,
    titleKey: 'cookiePolicy.title',
    descriptionKey: 'cookiePolicy.description',
  },
  {
    path: '/legal/privacy-policy',
    indexable: false,
    titleKey: 'privacyPolicy.title',
    descriptionKey: 'privacyPolicy.description',
  },
  {
    path: '/legal/terms-of-service',
    indexable: false,
    titleKey: 'termsOfService.title',
    descriptionKey: 'termsOfService.description',
  },
  {
    path: '/legal/legal-notice',
    indexable: false,
    titleKey: 'legalNotice.title',
    descriptionKey: 'legalNotice.description',
  },
  { path: '/payment/confirmation', indexable: false, titleKey: 'paymentConfirmation.title', descriptionKey: undefined },
] as const satisfies readonly SiteRoute[];

export const findRoute = (path: string) => SITE_ROUTES.find((route) => route.path === path);

export const indexableRoutes = (): SiteRoute[] => SITE_ROUTES.filter(({ indexable }) => indexable);

export const privateRoutes = (): SiteRoute[] => SITE_ROUTES.filter(({ indexable }) => !indexable);

export const isIndexable = (path: string): boolean =>
  SITE_ROUTES.find((route) => route.path === path)?.indexable ?? false;
