export const UNIDENTIFIED_COUNTRY = "XX";
export const TOR_COUNTRY = "T1";

const COUNTRY_CODE = /^[a-z]{2}$/;
const SENTINELS = new Set([UNIDENTIFIED_COUNTRY.toLowerCase(), TOR_COUNTRY.toLowerCase()]);

export const normalizeCountryCode = (raw: string | null | undefined): string => {
	const code = (raw ?? "").trim().toLowerCase();

	if (!COUNTRY_CODE.test(code) || SENTINELS.has(code)) return "";

	return code;
};

export interface NoStoreFetchParams {
	url: string;
	init?: RequestInit;
}

export const noStoreFetch = ({ url, init }: NoStoreFetchParams) =>
	fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(5000) });
