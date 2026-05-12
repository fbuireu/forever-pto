import { Effect } from 'effect';

const IP_SERVICE = 'https://api.ipify.org';
const GEO_SERVICE = 'https://ipinfo.io';
const FORMAT = 'json';

const detectCountryFromIPEffect = Effect.gen(function* () {
  const ipResponse = yield* Effect.tryPromise(() => fetch(`${IP_SERVICE}?format=${FORMAT}`, { cache: 'force-cache' }));

  if (!ipResponse.ok) return '';

  const { ip } = yield* Effect.tryPromise(() => ipResponse.json() as Promise<{ ip: string }>);
  if (!ip) return '';

  const geoResponse = yield* Effect.tryPromise(() =>
    fetch(`${GEO_SERVICE}/${ip}/${FORMAT}`, {
      headers: { Accept: 'application/json' },
      cache: 'force-cache',
    })
  );

  if (!geoResponse.ok) return '';

  const geoData = yield* Effect.tryPromise(() => geoResponse.json() as Promise<{ country?: string }>);
  return geoData.country?.toLowerCase() ?? '';
});

export async function detectCountryFromIP(): Promise<string> {
  return Effect.runPromise(detectCountryFromIPEffect.pipe(Effect.orElse(() => Effect.succeed(''))));
}
