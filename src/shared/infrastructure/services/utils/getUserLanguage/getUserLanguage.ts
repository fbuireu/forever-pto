import { DEFAULT_LANGUAGE } from "@const/const";

export function getUserLanguage(): string[] {
	try {
		return navigator.languages?.map((lang) => lang.split("-")[0]) || [DEFAULT_LANGUAGE];
	} catch {
		return [DEFAULT_LANGUAGE];
	}
}
