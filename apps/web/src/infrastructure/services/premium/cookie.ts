import { ACTIVATION_COOKIE } from "@application/dto/payment/types";
import type { NextResponse } from "next/server";

export const PREMIUM_COOKIE = "premium-token";
export const PREMIUM_SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
export const ACTIVATION_PROOF_LIFETIME_SECONDS = 60 * 60;
export const ACTIVATION_PROOF = "1";
const isProd = process.env.NODE_ENV === "production";

export interface SetPremiumCookieParams {
	response: NextResponse;
	token: string;
}

export function setPremiumCookie({ response, token }: SetPremiumCookieParams): void {
	response.cookies.set(PREMIUM_COOKIE, token, {
		httpOnly: true,
		secure: isProd,
		sameSite: "strict",
		maxAge: PREMIUM_SESSION_LIFETIME_SECONDS,
		path: "/",
	});
}

export function setActivationCookie(response: NextResponse): void {
	response.cookies.set(ACTIVATION_COOKIE, ACTIVATION_PROOF, {
		httpOnly: false,
		secure: isProd,
		sameSite: "strict",
		maxAge: ACTIVATION_PROOF_LIFETIME_SECONDS,
		path: "/",
	});
}

export function clearPremiumCookie(response: NextResponse): void {
	response.cookies.delete(PREMIUM_COOKIE);
}
