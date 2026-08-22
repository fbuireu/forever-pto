import { localeAlternates, localePath } from "@infrastructure/i18n/utils/url";
import { isIndexable } from "@infrastructure/seo/routes";
import type { Metadata } from "next";
import type { Locale } from "next-intl";

const SITE_NAME = "Forever PTO";
const OG_IMAGE = "/static/images/forever-pto-logo.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

interface BuildMetadataParams {
	baseUrl: string;
	locale: Locale;
	route: string;
	title: string;
	description?: string;
	keywords?: string;
}

export function buildMetadata({ baseUrl, locale, route, title, description, keywords }: BuildMetadataParams): Metadata {
	const url = localePath(locale, route);
	const indexable = isIndexable(route);

	return {
		title,
		...(description && { description }),
		...(indexable && keywords && { keywords }),
		metadataBase: new URL(baseUrl),
		alternates: {
			canonical: url,
			languages: localeAlternates(route),
		},
		...(description && {
			openGraph: {
				title,
				description,
				url,
				siteName: SITE_NAME,
				locale,
				type: "website",
				...(indexable && {
					images: [{ url: OG_IMAGE, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title }],
				}),
			},
		}),
		...(indexable &&
			description && {
				twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
			}),
		robots: indexable
			? {
					index: true,
					follow: true,
					googleBot: {
						index: true,
						follow: true,
						"max-image-preview": "large",
						"max-snippet": -1,
						"max-video-preview": -1,
					},
				}
			: { index: false, follow: false },
		other: {
			"text-scale": "scale",
		},
	};
}
