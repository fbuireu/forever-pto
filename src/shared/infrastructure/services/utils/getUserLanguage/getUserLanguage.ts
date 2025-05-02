import { I18N_CONFIG } from "@const/const";

export function getUserLanguage(): string[] {
	try {
		return navigator.languages?.map((lang) => lang.split("-")[0]) || [I18N_CONFIG.defaultLocale];
	} catch {
		return [I18N_CONFIG.defaultLocale];
	}
}
