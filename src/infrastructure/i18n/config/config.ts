import { routing } from "@infrastructure/i18n/routing/routing";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

	return {
		locale,
		messages: (await import(`@i18n/messages/${locale}.json`)).default,
	};
});
