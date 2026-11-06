import { Temporal } from "temporal-polyfill";

interface SetCookieParams {
	name: string;
	value: string;
	maxAge?: number;
}

export async function setCookie({ name, value, maxAge }: SetCookieParams): Promise<void> {
	if (typeof cookieStore !== "undefined") {
		await cookieStore.set({
			name,
			value,
			path: "/",
			expires: maxAge === undefined ? undefined : Temporal.Now.instant().add({ seconds: maxAge }).epochMilliseconds,
			sameSite: "lax",
		});
		return;
	}

	if (typeof document === "undefined") return;

	const attributes = [
		`${name}=${encodeURIComponent(value)}`,
		"path=/",
		"samesite=lax",
		...(maxAge === undefined ? [] : [`max-age=${maxAge}`]),
		...(typeof location !== "undefined" && location.protocol === "https:" ? ["secure"] : []),
	];

	// biome-ignore lint/suspicious/noDocumentCookie: this branch is the fallback for browsers with no Cookie Store API
	document.cookie = attributes.join("; ");
}
