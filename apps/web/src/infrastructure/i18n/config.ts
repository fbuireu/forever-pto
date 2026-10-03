import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./utils/url";

export default getRequestConfig(async ({ requestLocale }) => {
	const locale = resolveLocale(await requestLocale);

	return {
		locale,
		messages: (await import(`@i18n/messages/${locale}.json`)).default,
	};
});
