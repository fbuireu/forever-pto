"use client";

import { usePathname, useRouter } from "@application/i18n/navigation";
import type { LocaleCode } from "@infrastructure/i18n/locales";
import { useLanguages } from "@ui/hooks/useLanguages";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

export const useLanguageSwitch = () => {
	const locale = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();
	const languages = useLanguages();
	const t = useTranslations("a11y");

	const selectLanguage = useCallback(
		(newLocale: LocaleCode) => {
			push(pathname, { locale: newLocale, scroll: false });
		},
		[pathname, push],
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
