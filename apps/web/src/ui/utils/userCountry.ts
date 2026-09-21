const USER_COUNTRY_COOKIE = "user-country";

export function getUserCountryFromCookie(): string | undefined {
	if (typeof document === "undefined") return undefined;

	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${USER_COUNTRY_COOKIE}=`));

	return cookie?.split("=")[1] || undefined;
}
