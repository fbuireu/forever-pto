import type { NextRequest } from "next/server";

export async function detectCountryFromHeaders(request: NextRequest): Promise<string> {
	try {
		const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip");

		if (!clientIP) {
			return "";
		}

		const geoResponse = await fetch(`https://ipinfo.io/${clientIP}/json`, {
			headers: { Accept: "application/json" },
			cache: "no-store",
		});

		if (!geoResponse.ok) {
			return "";
		}

		const geoData = await geoResponse.json();
		if (!geoData.country) {
			return "";
		}

		return geoData.country.toLowerCase();
	} catch (_) {
		return "";
	}
}
