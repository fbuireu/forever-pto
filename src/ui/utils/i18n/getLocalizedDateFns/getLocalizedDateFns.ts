import { I18N_CONFIG } from "@const/const";
import { type Locale, ca, enUS, es, it } from "date-fns/locale";

export type LocaleKey = keyof typeof DATE_FNS_LOCALES;

export const DATE_FNS_LOCALES = {
	en: enUS,
	es: es,
	ca: ca,
	it: it,
} as const;

export function getLocalizedDateFns(locale: LocaleKey = I18N_CONFIG.DEFAULT_LOCALE as Locale): Locale {
	return DATE_FNS_LOCALES[locale];
}
