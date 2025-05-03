import { I18N_CONFIG } from "@const/const";
import type { Locales } from "@const/types";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: I18N_CONFIG.LOCALES,
	defaultLocale: I18N_CONFIG.DEFAULT_LOCALE as Locales[number],
});
