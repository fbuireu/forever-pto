import { localeAlternates, localePath } from "@infrastructure/i18n/utils/url";
import type { Metadata } from "next";
import type { Locale } from "next-intl";

const SITE_NAME = "Forever PTO";
const OG_IMAGE = "/static/images/forever-pto-logo.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

interface BuildMetadataParams {
	baseUrl: string;
	locale: Locale;
	path?: string;
	title: string;
	description?: string;
	keywords?: string;
	indexable: boolean;
}

export function buildMetadata({
	baseUrl,
	locale,
	path,
	title,
	description,
	keywords,
	indexable,
}: BuildMetadataParams): Metadata {
	const url = localePath(locale, path);

	return {
		title,
		...(description && { description }),
		...(keywords && { keywords }),
		metadataBase: new URL(baseUrl),
		alternates: {
			canonical: url,
			languages: localeAlternates(path),
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
