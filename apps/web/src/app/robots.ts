import { getPublicEnv } from "@infrastructure/services/env/getPublicEnv";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
	const { siteUrl: baseUrl } = await getPublicEnv();

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
