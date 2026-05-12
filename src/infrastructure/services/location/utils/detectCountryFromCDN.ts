import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';

const logger = getBetterStackInstance();
const LOCATION_IDENTIFIER = 'loc=';
const CDN_TRACE = 'cdn-cgi/trace';

const detectCountryFromCDNEffect = Effect.gen(function* () {
  const { env } = yield* Effect.tryPromise(() => getCloudflareContext({ async: true }));
  const response = yield* Effect.tryPromise(() =>
    fetch(`${env.NEXT_PUBLIC_SITE_URL}/${CDN_TRACE}`, { cache: 'force-cache' })
  );

  if (!response.ok) {
    return yield* Effect.fail(new Error('Error while getting information from the CDN'));
  }

  const text = yield* Effect.tryPromise(() => response.text());
  const location = text.split('\n').find((line) => line.startsWith(LOCATION_IDENTIFIER));

  return location ? location.substring(LOCATION_IDENTIFIER.length).trim().toLowerCase() : '';
});

export async function detectCountryFromCDN(): Promise<string> {
  return Effect.runPromise(
    detectCountryFromCDNEffect.pipe(
      Effect.catchAll((error) => {
        logger.warn('Error while detecting country from CDN', { error });
        return Effect.succeed('');
      })
    )
  );
}
