import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';
import type { NextRequest } from 'next/server';

const logger = getBetterStackInstance();

const LOCATION_IDENTIFIER = 'loc=';
const CDN_TRACE = 'cdn-cgi/trace';
export const CLOUDFLARE_COUNTRY_HEADER = 'cf-ipcountry';
export const UNIDENTIFIED_COUNTRY = 'XX';
export const TOR_COUNTRY = 'T1';
const IP_SERVICE = 'https://api.ipify.org';
const GEO_SERVICE = 'https://ipinfo.io';
const FORMAT = 'json';

const detectCountryFromCDNEffect = Effect.gen(function* () {
  const { env } = yield* Effect.tryPromise(() => getCloudflareContext({ async: true }));
  const response = yield* Effect.tryPromise(() =>
    fetch(`${env.NEXT_PUBLIC_SITE_URL}/${CDN_TRACE}`, { cache: 'force-cache', signal: AbortSignal.timeout(5000) })
  );

  if (!response.ok) {
    return yield* Effect.fail(new Error('Error while getting information from the CDN'));
  }

  const text = yield* Effect.tryPromise(() => response.text());
  const location = text.split('\n').find((line) => line.startsWith(LOCATION_IDENTIFIER));

  return location ? location.substring(LOCATION_IDENTIFIER.length).trim().toLowerCase() : '';
});

export async function detectCountryFromCDN() {
  return Effect.runPromise(
    detectCountryFromCDNEffect.pipe(
      Effect.catchAll((error) => {
        logger.warn('Error while detecting country from CDN', { error });
        return Effect.succeed('');
      })
    )
  );
}

export function detectCountryFromHeaders(request: NextRequest) {
  const country = request.headers.get(CLOUDFLARE_COUNTRY_HEADER);

  if (!country || country === UNIDENTIFIED_COUNTRY || country === TOR_COUNTRY) {
    return '';
  }

  return country.toLowerCase();
}

const detectCountryFromIPEffect = Effect.gen(function* () {
  const ipResponse = yield* Effect.tryPromise(() =>
    fetch(`${IP_SERVICE}?format=${FORMAT}`, { cache: 'force-cache', signal: AbortSignal.timeout(5000) })
  );

  if (!ipResponse.ok) return '';

  const { ip } = yield* Effect.tryPromise(() => ipResponse.json() as Promise<{ ip: string }>);
  if (!ip) return '';

  const geoResponse = yield* Effect.tryPromise(() =>
    fetch(`${GEO_SERVICE}/${ip}/${FORMAT}`, {
      headers: { Accept: 'application/json' },
      cache: 'force-cache',
      signal: AbortSignal.timeout(5000),
    })
  );

  if (!geoResponse.ok) return '';

  const geoData = yield* Effect.tryPromise(() => geoResponse.json() as Promise<{ country?: string }>);
  return geoData.country?.toLowerCase() ?? '';
});

export async function detectCountryFromIP() {
  return Effect.runPromise(detectCountryFromIPEffect.pipe(Effect.orElse(() => Effect.succeed(''))));
}
