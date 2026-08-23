import { getBetterStackInstance } from "@infrastructure/clients/logging/better-stack/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { normalizeCountryCode, noStoreFetch } from "./normalize";

const logger = getBetterStackInstance();

const LOCATION_IDENTIFIER = "loc=";
const CDN_TRACE = "cdn-cgi/trace";
export const CLOUDFLARE_COUNTRY_HEADER = "cf-ipcountry";
const IP_SERVICE = "https://api.ipify.org";
const GEO_SERVICE = "https://ipinfo.io";
const FORMAT = "json";

const detectCountryFromCDNEffect = Effect.gen(function* () {
	const { env } = yield* Effect.tryPromise(() => getCloudflareContext({ async: true }));
	const response = yield* Effect.tryPromise(() => noStoreFetch({ url: `${env.NEXT_PUBLIC_SITE_URL}/${CDN_TRACE}` }));

	if (!response.ok) {
		return yield* Effect.fail(new Error("Error while getting information from the CDN"));
	}

	const text = yield* Effect.tryPromise(() => response.text());
	const location = text.split("\n").find((line) => line.startsWith(LOCATION_IDENTIFIER));

	return normalizeCountryCode(location?.substring(LOCATION_IDENTIFIER.length));
});

export async function detectCountryFromCDN() {
	return Effect.runPromise(
		detectCountryFromCDNEffect.pipe(
			Effect.catchAll((error) => {
				logger.warn("Error while detecting country from CDN", { error });
				return Effect.succeed("");
			}),
		),
	);
}

export function detectCountryFromHeaders(request: NextRequest) {
	return normalizeCountryCode(request.headers.get(CLOUDFLARE_COUNTRY_HEADER));
}

const detectCountryFromEgressIPEffect = Effect.gen(function* () {
	const ipResponse = yield* Effect.tryPromise(() => noStoreFetch({ url: `${IP_SERVICE}?format=${FORMAT}` }));

	if (!ipResponse.ok) return "";

	const { ip } = yield* Effect.tryPromise(() => ipResponse.json() as Promise<{ ip: string }>);
	if (!ip) return "";

	const geoResponse = yield* Effect.tryPromise(() =>
		noStoreFetch({ url: `${GEO_SERVICE}/${ip}/${FORMAT}`, init: { headers: { Accept: "application/json" } } }),
	);

	if (!geoResponse.ok) return "";

	const geoData = yield* Effect.tryPromise(() => geoResponse.json() as Promise<{ country?: string }>);
	return normalizeCountryCode(geoData.country);
});

export async function detectCountryFromEgressIP() {
	return Effect.runPromise(detectCountryFromEgressIPEffect.pipe(Effect.orElse(() => Effect.succeed(""))));
}
