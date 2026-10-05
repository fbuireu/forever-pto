# apps/web/src/infrastructure/services/location

## Purpose

Guesses the visitor's Country so the planner opens on a plausible holiday calendar instead of an empty one.
The strategies are tried in order and the first non-empty answer wins, as a lower-case ISO 3166-1 alpha-2
code.

This is a convenience, not a fact: the user can always override the Country, and a wrong or empty guess
costs one interaction. Nothing downstream should treat the result as authoritative.

## Files

| File | Role |
| --- | --- |
| [`detectCountry.ts`](./detectCountry.ts) | Runs the chain. The ordering and nothing else |
| [`utils/strategies.ts`](./utils/strategies.ts) | The strategies and `CLOUDFLARE_COUNTRY_HEADER` |
| [`utils/normalize.ts`](./utils/normalize.ts) | `normalizeCountryCode`, the one exit rule, plus `noStoreFetch`, `stringField` and the `UNIDENTIFIED_COUNTRY` / `TOR_COUNTRY` sentinels |

## The chain

`detectCountry(request)` calls, in this order:

1. **`detectCountryFromHeaders(request)`** reads the `cf-ipcountry` header the edge already put on the
   request. Synchronous, no I/O, and the only signal derived from the visitor's own connection, which is why
   it goes first. **When the header is present its answer is final, even an empty one.** Cloudflare sends `XX`
   or `T1` when it cannot place the visitor, and the two strategies below would then locate the Worker's own
   egress rather than the visitor, while no cookie is set on failure, so every navigation would repeat up to
   three sequential subrequests for a wrong answer. They run only when the header is absent, which is local
   development and nothing in production.
2. **`detectCountryFromCDN()`** resolves the Cloudflare context, fetches
   `${env.NEXT_PUBLIC_SITE_URL}/cdn-cgi/trace` with a 5 s `AbortSignal.timeout`, and reads the `loc=` line.
3. **`detectCountryFromEgressIP()`** calls `api.ipify.org` for an IP, then `ipinfo.io/<ip>/json` for its country.
   A round trip each, with the same 5 s timeout.

**Empty string is the failure value throughout.** Never `null`, never a throw: every strategy catches its own
errors and returns `''`, and `detectCountry` returns `''` when every one of them comes up empty. [`proxy/location.ts`](../../proxy/location.ts)
treats that as "no cookie to set" and moves on.

**The only caller is the proxy.** `proxy/location.ts` calls `detectCountry` from [`src/middleware.ts`](../../../middleware.ts), so
everything here runs server-side inside a Cloudflare Worker request, including the fetches, which read like
browser calls and are not. It also short-circuits on an existing `user-country` cookie, which is what keeps
this chain off the hot path for returning visitors. Between that cookie and the header being final whenever
it is present, the network strategies never sit in front of a production HTML response.

## Gotchas

**The trace is fetched from this app's own origin, not from `cloudflare.com`.** If `NEXT_PUBLIC_SITE_URL` is
unset the fetch simply fails and the chain continues; if it points at another environment, the trace reports
that environment's answer. The value is environment-specific configuration, not a constant
([ADR 0004](../../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**`detectCountryFromEgressIP` does not measure the visitor, and its name says so.** Both of its fetches
originate inside the proxy Worker, so `api.ipify.org` reports the runtime's *egress* address and
`ipinfo.io` returns that address's country: on Cloudflare the colo the request landed in, off Cloudflare
whatever network the process sits on. It is last because a guess about the server must never beat a fact about
the visitor, and its result is not visitor geolocation.

**`normalizeCountryCode` is the exit of every strategy:** trim, lower-case, reject anything that is not two
ASCII letters, and reject the sentinels `XX` and `T1`, which mean unidentified traffic and a Tor exit node.
Whatever a strategy answers reaches the week-long `user-country` cookie and then `new Holidays(country)`.
`noStoreFetch` beside it owns `cache: 'no-store'` and the 5 s timeout.

**Effect is used here but never escapes.** Both async strategies are `Effect.gen` programs terminated inside
their own wrapper with `Effect.runPromise`, because the proxy has no `ApplicationLayer` to provide. For
the same reason logging goes through the `logger` import rather than `LoggerService`,
the documented logging exception in
[ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md).

**The third-party bodies are read as `unknown` and picked with `stringField`, not cast, and not with zod.**
`api.ipify.org` and `ipinfo.io` answer JSON this app does not control, and a cast is not harmless here: a `null`
body, or a `country` that is not a string, would throw a `TypeError` inside the generator. Effect records a throw
there as a *defect*, and `Effect.orElse` recovers only *failures*, so `detectCountryFromEgressIP` would reject and
take the middleware with it, against the "never a throw" rule above. `stringField({ body, field })` answers the
field only when the body is an object and the value is a string, and `undefined` otherwise, which every caller
reads as `''`.

zod is deliberately not the tool here, although the rest of the app checks the JSON it reads with it. This folder
runs inside [`src/middleware.ts`](../../../middleware.ts), whose import graph does not reach zod at all, and
the middleware is evaluated on every navigation. zod classic does not tree-shake to a small core: one
`z.object` with a `validate` call bundles to roughly 25 KB compressed with named imports and about 90 KB through
the `z` namespace, and `zod/mini`, which does shake, has no `validate`. The path it would guard is the last
resort of the chain, which production never reaches while `cf-ipcountry` is present. Two `typeof` checks cost
nothing and give the same answer.

**Only the CDN failure is logged.** It goes through `logger.warn` with a `reason`: the message of the call that
rejected (the `UnknownException` Effect wraps it in says only that something failed) or of the refusal itself, since an
`Error` in a log context serialises to nothing. The egress-IP chain is closed with `Effect.orElse`, so a failure there
is invisible: if detection has quietly stopped working, absence of logs is not evidence.

## Testing

Each file has a co-located test. [`detectCountry.test.ts`](./detectCountry.test.ts) mocks `./utils/strategies` outright and asserts
only the fallthrough, including that a later strategy is *not* called once an earlier one answers, and
that a present header stops the chain even when Cloudflare could not resolve it.
[`utils/strategies.test.ts`](./utils/strategies.test.ts) stubs `getCloudflareContext` and the global `fetch`, and covers each failure mode
separately, since every one of them has to produce `''` rather than an exception.
[`utils/normalize.test.ts`](./utils/normalize.test.ts) pins the exit rule on its own.

`utils/strategies.test.ts` uses the locale constants from [`locales.ts`](../../i18n/locales.ts) as country
codes, which is a coincidence of spelling (`es`, `de`, `fr`) and not a claim that locale and Country are the
same thing; the Country is never inferred from the language.
