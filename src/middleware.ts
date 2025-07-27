import { routing } from "@infrastructure/i18n/routing";
import { middleware as customMiddleware } from "@infrastructure/middleware";
import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";

const i18nMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const i18nResponse = await i18nMiddleware(request) as NextResponse;
    
    return await customMiddleware(request, i18nResponse);
}

export const config = {
    matcher: ["/", "/(en|es|ca|it)/:path*"],
};