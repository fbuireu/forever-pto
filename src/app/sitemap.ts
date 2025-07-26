import { I18N_CONFIG } from "@const/const";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

	const sitemapEntries: MetadataRoute.Sitemap = I18N_CONFIG.LOCALES.map((locale) => ({
		url: `${baseUrl}/${locale}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: locale === I18N_CONFIG.DEFAULT_LOCALE ? 1 : 0.8,
		alternates: {
			languages: Object.fromEntries(I18N_CONFIG.LOCALES.map((lang) => [lang, `${baseUrl}/${lang}`])),
		},
	}));

	return sitemapEntries;
}
