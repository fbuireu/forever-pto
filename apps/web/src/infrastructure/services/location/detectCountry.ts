import type { NextRequest } from "next/server";
import type { DetectedCountryCode } from "./utils/normalize";
import {
	CLOUDFLARE_COUNTRY_HEADER,
	detectCountryFromCDN,
	detectCountryFromEgressIP,
	detectCountryFromHeaders,
} from "./utils/strategies";

export async function detectCountry(request: NextRequest): Promise<DetectedCountryCode | ""> {
	if (request.headers.has(CLOUDFLARE_COUNTRY_HEADER)) return detectCountryFromHeaders(request);

	const cdnLocation = await detectCountryFromCDN();
	if (cdnLocation) return cdnLocation;

	return detectCountryFromEgressIP();
}
