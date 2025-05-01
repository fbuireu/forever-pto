import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "es", "ca", "it"] as const,
	defaultLocale: "en" as const,
});

declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof routing.locales)[number];
		Messages: typeof messages;
		Formats: typeof getRequestConfig;
	}
}
