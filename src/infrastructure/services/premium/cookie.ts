import type { NextResponse } from "next/server";

export const PREMIUM_COOKIE = "premium-token";
export const PREMIUM_SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

export function setPremiumCookie(response: NextResponse, token: string) {
	response.cookies.set(PREMIUM_COOKIE, token, {
		httpOnly: true,
		secure: isProd,
		sameSite: "strict",
		maxAge: PREMIUM_SESSION_LIFETIME_SECONDS,
		path: "/",
	});
}

export function clearPremiumCookie(response: NextResponse) {
	response.cookies.delete(PREMIUM_COOKIE);
}
