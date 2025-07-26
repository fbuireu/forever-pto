import { I18N_CONFIG } from "@const/const";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
			alternates: {
				languages: Object.fromEntries(I18N_CONFIG.LOCALES.map((lang) => [lang, `${baseUrl}/${lang}`])),
			},
		},
	];
}
