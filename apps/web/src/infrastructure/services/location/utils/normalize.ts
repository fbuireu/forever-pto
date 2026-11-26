declare const detectedCountryCodeBrand: unique symbol;

export type DetectedCountryCode = string & { readonly [detectedCountryCodeBrand]: true };

export const UNIDENTIFIED_COUNTRY = "XX";
export const TOR_COUNTRY = "T1";

const COUNTRY_CODE = /^[a-z]{2}$/;
const SENTINELS = new Set([UNIDENTIFIED_COUNTRY.toLowerCase(), TOR_COUNTRY.toLowerCase()]);

export const isDetectedCountryCode = (value: unknown): value is DetectedCountryCode =>
	typeof value === "string" && COUNTRY_CODE.test(value) && !SENTINELS.has(value);

export const normalizeCountryCode = (raw: string | null | undefined): DetectedCountryCode | "" => {
	const code = (raw ?? "").trim().toLowerCase();

	return isDetectedCountryCode(code) ? code : "";
};

export interface NoStoreFetchParams {
	url: string;
	init?: RequestInit;
}

export const noStoreFetch = ({ url, init }: NoStoreFetchParams): Promise<Response> =>
	fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(5000) });

export interface StringFieldParams {
	body: unknown;
	field: string;
}

export const stringField = ({ body, field }: StringFieldParams): string | undefined => {
	if (typeof body !== "object" || body === null) return undefined;

	const value: unknown = Reflect.get(body, field);

	return typeof value === "string" ? value : undefined;
};
