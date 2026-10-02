import { USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";

export function getUserCountryFromCookie(): string | undefined {
	if (typeof document === "undefined") return undefined;

	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${USER_COUNTRY_COOKIE}=`));

	return cookie?.split("=")[1] || undefined;
}
