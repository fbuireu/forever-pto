import { buildMetadata } from "@infrastructure/seo/buildMetadata";
import { type RoutePath, routeFor } from "@infrastructure/seo/routes";
import { getPublicEnv } from "@infrastructure/services/env/getPublicEnv";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

interface RouteSegmentParams {
	params: Promise<{ locale: Locale }>;
}

export const routeMetadata =
	(path: RoutePath) =>
	async ({ params }: RouteSegmentParams): Promise<Metadata> => {
		const { locale } = await params;
		const route = routeFor(path);
		const [{ siteUrl: baseUrl }, t] = await Promise.all([
			getPublicEnv(),
			getTranslations({ locale, namespace: "metadata" }),
		]);

		return buildMetadata({
			baseUrl,
			locale,
			route: path,
			title: t(route.titleKey),
			...(route.descriptionKey && { description: t(route.descriptionKey) }),
			...(route.indexable && { keywords: t("keywords") }),
		});
	};
