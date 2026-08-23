import { LOCALE_COOKIE } from "@infrastructure/i18n/locales";
import type { NextResponse } from "next/server";

export interface SetLocaleCookieParams {
	response: NextResponse;
	value: string;
}

export function setLocaleCookie({ response, value }: SetLocaleCookieParams) {
	response.cookies.set({
		name: LOCALE_COOKIE,
		value,
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
	});
}
