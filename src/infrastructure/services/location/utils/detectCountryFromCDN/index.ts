const LOCATION_IDENTIFIER = "loc=";
const CDN_TRACE = "cdn-cgi/trace";

export async function detectCountryFromCDN(): Promise<string> {
	try {
		const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/${CDN_TRACE}`, {
			cache: "force-cache",
		});
		if (!response.ok) {
			throw new Error("Error while getting information from the CDN");
		}

		const lines = (await response.text()).split("\n");
		const location = lines.find((line) => line.startsWith(LOCATION_IDENTIFIER));

        if (location) {
			return location.substring(LOCATION_IDENTIFIER.length).trim().toLowerCase();
		}

		return "";
	} catch (_) {
		return "";
	}
}