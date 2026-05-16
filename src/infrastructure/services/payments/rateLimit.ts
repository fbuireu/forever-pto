import { RateLimitError } from '@infrastructure/errors';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';

const LIMIT = 10;
const WINDOW_SECONDS = 60;

const isBlocked = (ip: string): Effect.Effect<boolean> =>
  Effect.tryPromise({
    try: async () => {
      const { env } = await getCloudflareContext({ async: true });
      const key = `rl:payment:${ip}`;
      const current = await env.RATE_LIMIT_KV.get(key);
      const count = current ? Number.parseInt(current, 10) : 0;

      if (count >= LIMIT) return true;

      await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
      return false;
    },
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  }).pipe(Effect.catchAll(() => Effect.succeed(false)));

export const checkRateLimit = (ip: string): Effect.Effect<void, RateLimitError> =>
  Effect.gen(function* () {
    const blocked = yield* isBlocked(ip);
    if (blocked) yield* Effect.fail(new RateLimitError({ ip }));
  });
