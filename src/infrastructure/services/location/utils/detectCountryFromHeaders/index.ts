import type { NextRequest } from "next/server";

const CLOUDFLARE_COUNTRY_HEADER = "cf-ipcountry";
const UNIDENTIFIED_COUNTRY = "XX"; 
const TOR_COUNTRY = "T1"; 

export async function detectCountryFromHeaders(request: NextRequest): Promise<string> {
	try {
		const country = request.headers.get(CLOUDFLARE_COUNTRY_HEADER);
		
		if (!country || country === UNIDENTIFIED_COUNTRY || country === TOR_COUNTRY) {
			return "";
		}

		return country.toLowerCase();
	} catch (_) {
		return "";
	}
}