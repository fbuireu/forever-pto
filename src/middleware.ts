import { I18N_CONFIG } from "@const/const";
import { middleware as customMiddleware } from "@infrastructure/middleware/middleware";
import type { Locale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";

const i18nMiddleware = createMiddleware({
	locales: I18N_CONFIG.LOCALES,
	defaultLocale: I18N_CONFIG.DEFAULT_LOCALE as Locale,
	localePrefix: I18N_CONFIG.LOCALE_PREFIX,
	localeDetection: I18N_CONFIG.LOCALE_DETECTION,
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const i18nResponse = i18nMiddleware(request);
	return customMiddleware(request, i18nResponse);
}

export const config = {
	matcher: ["/", "/(en|es|ca|it)/:path*"],
};
