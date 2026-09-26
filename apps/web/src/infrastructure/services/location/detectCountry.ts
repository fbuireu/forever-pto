import type { NextRequest } from "next/server";
import {
	CLOUDFLARE_COUNTRY_HEADER,
	detectCountryFromCDN,
	detectCountryFromEgressIP,
	detectCountryFromHeaders,
} from "./utils/strategies";

export async function detectCountry(request: NextRequest) {
	if (request.headers.has(CLOUDFLARE_COUNTRY_HEADER)) return detectCountryFromHeaders(request);

	const cdnLocation = await detectCountryFromCDN();
	if (cdnLocation) return cdnLocation;

	return detectCountryFromEgressIP();
}
