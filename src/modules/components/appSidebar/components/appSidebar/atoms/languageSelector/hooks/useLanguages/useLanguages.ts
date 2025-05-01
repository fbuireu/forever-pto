import type { I18N_CONFIG } from "@const/const";
import { useTranslations } from "next-intl";

type LanguageKey = (typeof I18N_CONFIG.locales)[number];

interface UseLanguagesReturn {
	code: LanguageKey;
	label: string;
}

export function useLanguages(): UseLanguagesReturn[] {
	const t = useTranslations("languages");

	return I18N_CONFIG.locales.map((code: LanguageKey) => ({
		code,
		label: t(code),
	}));
}
