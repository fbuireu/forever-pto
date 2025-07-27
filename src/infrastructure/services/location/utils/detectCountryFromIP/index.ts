const IP_SERVICE = "https://api.ipify.org";
const GEO_SERVICE = "https://ipinfo.io";
const FORMAT = "json";

export async function detectCountryFromIP() {
	try {
		const ipResponse = await fetch(`${IP_SERVICE}?format=${FORMAT}`, {
			cache: "force-cache",
		});

		if (!ipResponse.ok) {
			throw new Error("Client IP couldn't be obtained");
		}

		const { ip } = await ipResponse.json();

		if (!ip) {
			return "";
		}

		const geoResponse = await fetch(`${GEO_SERVICE}/${ip}/${FORMAT}`, {
			headers: {
				Accept: "application/json",
			},
			cache: "force-cache",
		});

		if (!geoResponse.ok) {
			return "";
		}

        const geoData = await geoResponse.json();
        
		return geoData.country?.toLowerCase() || "";
	} catch (_) {
		return "";
	}
}