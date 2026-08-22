import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { indexableRoutes } from "@infrastructure/seo/routes";
import { getPublicEnv } from "@infrastructure/services/env/getPublicEnv";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const { siteUrl: baseUrl } = await getPublicEnv();

	return LOCALES.flatMap((locale) =>
		indexableRoutes().map(({ path, changeFrequency, priority }) => ({
			url: `${baseUrl}${localePath(locale, path)}`,
			lastModified: new Date(),
			changeFrequency,
			priority,
		})),
	);
}
