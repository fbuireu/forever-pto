"use client";

import { usePathname, useRouter } from "@application/i18n/navigation";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import type { LocaleCode } from "@infrastructure/i18n/locales";
import { type Locale, useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { type Language, useLanguages } from "./useLanguages";

interface LanguageSwitch {
	locale: Locale;
	languages: Language[];
	currentLanguage: Language | undefined;
	selectLanguage: (newLocale: LocaleCode) => void;
	switcherLabel: string;
}

export const useLanguageSwitch = (): LanguageSwitch => {
	const locale = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();
	const languages = useLanguages();
	const t = useTranslations("a11y");

	const selectLanguage = useCallback(
		(newLocale: LocaleCode) => {
			track({ event: "language_changed", properties: { from: locale, to: newLocale } });
			push(pathname, { locale: newLocale, scroll: false });
		},
		[locale, pathname, push],
	);

	const currentLanguage = useMemo(() => languages.find(({ code }) => code === locale), [languages, locale]);

	return {
		locale,
		languages,
		currentLanguage,
		selectLanguage,
		switcherLabel: t("selectLanguage", { current: currentLanguage?.label ?? locale }),
	};
};
