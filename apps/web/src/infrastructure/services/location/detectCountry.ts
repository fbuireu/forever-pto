import type { NextRequest } from "next/server";
import { detectCountryFromCDN, detectCountryFromEgressIP, detectCountryFromHeaders } from "./utils/strategies";

export async function detectCountry(request: NextRequest) {
	const fromHeaders = detectCountryFromHeaders(request);
	if (fromHeaders) return fromHeaders;

	const cdnLocation = await detectCountryFromCDN();
	if (cdnLocation) return cdnLocation;

	return detectCountryFromEgressIP();
}
