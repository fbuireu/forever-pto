import { detectCountryFromCDN } from "@infrastructure/services/location/detectLocation/utils/detectCountryFromCDN/detectCountryFromCDN";
import { detectCountryFromIP } from "@infrastructure/services/location/detectLocation/utils/detectCountryFromIP/detectCountryFromIP";
import type { NextRequest } from "next/server";
import { detectCountryFromHeaders } from "./utils/detectCountryFromHeaders/detectCountryFromHeaders";

// Cache para evitar múltiples llamadas
let locationCache: { country: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function detectLocation(request: NextRequest): Promise<string> {
	const now = Date.now();

	// Usar cache si está disponible y no ha expirado
	if (locationCache && now - locationCache.timestamp < CACHE_DURATION) {
		return locationCache.country;
	}

	try {
		// Intentar CDN primero (más rápido)
		const cdnLocation = await detectCountryFromCDN();
		if (cdnLocation) {
			locationCache = { country: cdnLocation, timestamp: now };
			return cdnLocation;
		}

		// Fallback: headers o IP en paralelo
		const [headerLocation, ipLocation] = await Promise.allSettled([
			detectCountryFromHeaders(request),
			detectCountryFromIP(),
		]);

		const location =
			headerLocation.status === "fulfilled" && headerLocation.value
				? headerLocation.value
				: ipLocation.status === "fulfilled" && ipLocation.value
					? ipLocation.value
					: "";

		locationCache = { country: location, timestamp: now };
		return location;
	} catch (_) {
		locationCache = { country: "", timestamp: now };
		return "";
	}
}
