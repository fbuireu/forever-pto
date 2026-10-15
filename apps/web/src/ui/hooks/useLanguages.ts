import { LOCALES, type LocaleCode } from "@infrastructure/i18n/locales";
import { useTranslations } from "next-intl";

export interface Language {
	code: LocaleCode;
	label: string;
}

export function useLanguages(): Language[] {
	const t = useTranslations("languages");

	return LOCALES.map((code) => ({
		code,
		label: t(code),
	}));
}
