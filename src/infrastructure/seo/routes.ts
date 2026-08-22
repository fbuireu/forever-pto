import type { MetadataRoute } from "next";

type SitemapHints = Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">;

export interface SiteRoute extends Partial<SitemapHints> {
	path: string;
	indexable: boolean;
}

export const SITE_ROUTES: SiteRoute[] = [
	{ path: "", indexable: true, changeFrequency: "monthly", priority: 1 },
	{ path: "/planner", indexable: true, changeFrequency: "weekly", priority: 0.9 },
	{ path: "/legal/cookie-policy", indexable: false },
	{ path: "/legal/privacy-policy", indexable: false },
	{ path: "/legal/terms-of-service", indexable: false },
	{ path: "/legal/legal-notice", indexable: false },
	{ path: "/payment/confirmation", indexable: false },
];

export const indexableRoutes = (): SiteRoute[] => SITE_ROUTES.filter(({ indexable }) => indexable);

export const privateRoutes = (): SiteRoute[] => SITE_ROUTES.filter(({ indexable }) => !indexable);

export const isIndexable = (path: string): boolean =>
	SITE_ROUTES.find((route) => route.path === path)?.indexable ?? false;
