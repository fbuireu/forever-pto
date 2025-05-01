import { I18N_CONFIG } from "@const/const";
import { middleware as customMiddleware } from "@infrastructure/middleware/middleware";
import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";

const i18nMiddleware = createMiddleware({
	locales: I18N_CONFIG.locales,
	defaultLocale: I18N_CONFIG.defaultLocale,
	localePrefix: I18N_CONFIG.localePrefix,
	localeDetection: I18N_CONFIG.localeDetection,
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const i18nResponse = i18nMiddleware(request);
	return customMiddleware(request, i18nResponse);
}

export const config = {
	matcher: ["/", "/(en|es|ca|it)/:path*"],
};
