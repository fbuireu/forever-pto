import type { ForeverPtoProps } from "@app/[locale]/page";
import { I18N_CONFIG } from "@const/const";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: ForeverPtoProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "common" });

	return {
		title: t("title"),
		description: t("description"),
		metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
		alternates: {
			canonical: "/",
			languages: I18N_CONFIG.LOCALES.reduce((acc, lang) => Object.assign(acc, { [lang]: `/${lang}` }), {}),
		},
		openGraph: {
			title: t("title"),
			description: t("description"),
			url: "/",
			siteName: t("title"),
			locale,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("description"),
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
			},
		},
		verification: {
			// google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
		},
	};
}
