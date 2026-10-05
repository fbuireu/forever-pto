import { logger } from "@infrastructure/logging/logger";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Cause, Effect } from "effect";
import type { NextRequest } from "next/server";
import { normalizeCountryCode, noStoreFetch, stringField } from "./normalize";

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

const reasonOf = (failure: Error): string =>
	failure instanceof Cause.UnknownException && failure.error instanceof Error ? failure.error.message : failure.message;

export async function detectCountryFromCDN() {
	return Effect.runPromise(
		detectCountryFromCDNEffect.pipe(
			Effect.catchAll((failure) => {
				logger.warn({ message: "Error while detecting country from CDN", context: { reason: reasonOf(failure) } });
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

	const ipBody: unknown = yield* Effect.tryPromise(() => ipResponse.json());
	const ip = stringField({ body: ipBody, field: "ip" });
	if (!ip) return "";

	const geoResponse = yield* Effect.tryPromise(() =>
		noStoreFetch({
			url: `${GEO_SERVICE}/${encodeURIComponent(ip)}/${FORMAT}`,
			init: { headers: { Accept: "application/json" } },
		}),
	);

	if (!geoResponse.ok) return "";

	const geoBody: unknown = yield* Effect.tryPromise(() => geoResponse.json());
	return normalizeCountryCode(stringField({ body: geoBody, field: "country" }));
});

export async function detectCountryFromEgressIP() {
	return Effect.runPromise(detectCountryFromEgressIPEffect.pipe(Effect.orElse(() => Effect.succeed(""))));
}
