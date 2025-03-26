import { detectCountryFromCDN } from "@infrastructure/services/location/detectLocation/utils/detectCountryFromCDN/detectCountryFromCDN";
import { detectCountryFromIP } from "@infrastructure/services/location/detectLocation/utils/detectCountryFromIP/detectCountryFromIP";
import type { NextRequest } from "next/server";
import { detectCountryFromHeaders } from "./utils/detectCountryFromHeaders/detectCountryFromHeaders";

export async function detectLocation(request: NextRequest): Promise<string> {
	try {
		return await Promise.race([detectCountryFromHeaders(request), detectCountryFromIP(), detectCountryFromCDN()]);
	} catch (error) {
		return "";
	}
}
