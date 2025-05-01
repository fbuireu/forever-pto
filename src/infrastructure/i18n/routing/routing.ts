import { I18N_CONFIG } from "@const/const";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: I18N_CONFIG.locales,
	defaultLocale: I18N_CONFIG.defaultLocale,
});
