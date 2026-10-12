import { resolveLocale } from "@infrastructure/i18n/utils/url";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

interface LocaleSegmentProps {
	params: Promise<{ locale: string }>;
}

export const notFoundTitle = async (locale: Locale): Promise<Metadata> => {
	const t = await getTranslations({ locale, namespace: "metadata" });

	return { title: t("notFound.title") };
};

export const notFoundMetadata = async ({ params }: LocaleSegmentProps): Promise<Metadata> =>
	notFoundTitle(resolveLocale((await params).locale));
