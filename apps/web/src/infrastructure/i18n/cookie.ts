import { LOCALE_COOKIE } from "@infrastructure/i18n/locales";
import type { NextResponse } from "next/server";

export const LOCALE_COOKIE_POLICY = {
	name: LOCALE_COOKIE,
	secure: true,
	sameSite: "lax",
	path: "/",
} as const;

export function setLocaleCookie(response: NextResponse, value: string) {
	response.cookies.set({ ...LOCALE_COOKIE_POLICY, value });
}
