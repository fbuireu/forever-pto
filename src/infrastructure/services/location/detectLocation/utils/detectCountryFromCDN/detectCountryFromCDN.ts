const LOCATION_IDENTIFIER = "loc=";

export async function detectCountryFromCDN(): Promise<string> {
	try {
		const response = await fetch("https://stretchmytimeoff.com/cdn-cgi/trace", {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error("Error while getting information from the CDN");
		}

		const text = await response.text();
		const lines = text.split("\n");
		const location = lines.find((line) => line.startsWith(LOCATION_IDENTIFIER));

		if (location) {
			return location.substring(LOCATION_IDENTIFIER.length).trim().toLowerCase();
		}

		return "";
	} catch (error) {
		return "";
	}
}
