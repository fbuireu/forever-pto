import type { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "./locales";

export const LOCALE_COOKIE_POLICY = {
	name: LOCALE_COOKIE,
	secure: true,
	sameSite: "lax",
	path: "/",
} as const;

export interface SetLocaleCookieParams {
	response: NextResponse;
	value: string;
}

export function setLocaleCookie({ response, value }: SetLocaleCookieParams) {
	response.cookies.set({ ...LOCALE_COOKIE_POLICY, value });
}
