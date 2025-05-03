import { I18N_CONFIG } from "@const/const";
import { type AppConfig, useTranslations } from "next-intl";

interface UseLanguagesReturn {
	code: AppConfig["Locale"];
	label: string;
}

export function useLanguages(): UseLanguagesReturn[] {
	const t = useTranslations("languages");

	return I18N_CONFIG.LOCALES.map((code) => ({
		code,
		label: t(code),
	}));
}
