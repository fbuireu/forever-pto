import { RateLimitError } from "@infrastructure/errors";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Effect } from "effect";

const isBlocked = (ip: string): Effect.Effect<boolean> =>
	Effect.tryPromise({
		try: async () => {
			const { env } = await getCloudflareContext({ async: true });
			const { success } = await env.PAYMENT_RATE_LIMITER.limit({ key: ip });

			return !success;
		},
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	}).pipe(Effect.catchAll(() => Effect.succeed(false)));

export const checkRateLimit = (ip: string): Effect.Effect<void, RateLimitError> =>
	Effect.gen(function* () {
		const blocked = yield* isBlocked(ip);
		if (blocked) yield* Effect.fail(new RateLimitError({ ip }));
	});
