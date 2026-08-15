# apps/web/src/infrastructure/services/location

## Purpose

Guesses the visitor's Country so the planner opens on a plausible holiday calendar instead of an empty one.
Three strategies are tried in order and the first non-empty answer wins, as a lower-case ISO 3166-1 alpha-2
code.

This is a convenience, not a fact: the user can always override the Country, and a wrong or empty guess
costs one interaction. Nothing downstream should treat the result as authoritative.

## Files

| File | Role |
| --- | --- |
| `detectCountry.ts` | Runs the chain. The ordering and nothing else |
| `utils/strategies.ts` | The three strategies plus the constants they share (`CLOUDFLARE_COUNTRY_HEADER`, `UNIDENTIFIED_COUNTRY`, `TOR_COUNTRY`) |

## The chain

`detectCountry(request)` calls, in this order:

1. **`detectCountryFromHeaders(request)`** — reads the `cf-ipcountry` header the edge already put on the
   request. Synchronous, no I/O, and the only signal derived from the visitor's own connection, which is why
   it goes first.
2. **`detectCountryFromCDN()`** — resolves the Cloudflare context, fetches
   `${env.NEXT_PUBLIC_SITE_URL}/cdn-cgi/trace` with a 5 s `AbortSignal.timeout`, and reads the `loc=` line.
3. **`detectCountryFromEgressIP()`** — `api.ipify.org` for an IP, then `ipinfo.io/<ip>/json` for its country.
   Two round trips, each with the same 5 s timeout.

**Empty string is the failure value throughout.** Never `null`, never a throw: every strategy catches its own
errors and returns `''`, and `detectCountry` returns `''` when all three come up empty. `proxy/location.ts`
treats that as "no cookie to set" and moves on.

**The only caller is the middleware.** `proxy/location.ts` calls `detectCountry` from `src/middleware.ts`, so
everything here runs server-side inside a Cloudflare Worker request — including the fetches, which read like
browser calls and are not. It also short-circuits on an existing `user-country` cookie, which is what keeps
this chain off the hot path for returning visitors. Between that cookie and the header running first, the two
network strategies sit in front of an HTML response only when both have already come up empty.

## Gotchas

**The trace is fetched from this app's own origin, not from `cloudflare.com`.** If `NEXT_PUBLIC_SITE_URL` is
unset the fetch simply fails and the chain continues; if it points at another environment, the trace reports
that environment's answer. The value is environment-specific configuration, not a constant
([ADR 0004](../../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**All three fetches are `cache: 'no-store'`, and must stay that way.** Every response here identifies whoever
asked for it, so a stored copy would hand one visitor's Country to the next — which then gets written to the
week-long `user-country` cookie by `proxy/location.ts`. Nothing in the chain re-validates, so the only safe
setting is no storage at all.

**`detectCountryFromEgressIP` does not measure the visitor, and its name says so.** Both of its fetches
originate inside the middleware Worker, so `api.ipify.org` reports the runtime's *egress* address and
`ipinfo.io` returns that address's country. On Cloudflare that is the colo the request landed in — usually
near the visitor, never derived from their connection; off Cloudflare it is whatever network the process
sits on. It is kept as the last resort precisely because it is the only strategy that still answers when
neither `cf-ipcountry` nor the trace has anything to read, and it is last because a guess about the server
must never beat a fact about the visitor. Do not read its result as visitor geolocation, and do not promote
it up the chain.

**The same reservation applies to the trace, in weaker form.** It is fetched by the Worker rather than by the
browser, so `loc=` describes the subrequest's client. `cf-ipcountry` is the only signal derived from the
visitor's own connection ([ADR 0004](../../../../../../adr/0004-cloudflare-workers-as-deployment-target.md) —
the edge exposing the country on the request is the reason no geolocation service is needed on the common
path).

**`XX` and `T1` are filtered, and only in the header strategy.** They mean unidentified traffic and a Tor
exit node — not countries, and not values `date-holidays` could do anything with. The CDN trace's `loc` line
is passed through as-is, so the same two codes can reach the cookie by that route.

**Effect is used here but never escapes.** Both async strategies are `Effect.gen` programs terminated inside
their own wrapper with `Effect.runPromise`, because the middleware has no `ApplicationLayer` to provide. For
the same reason logging goes through the `getBetterStackInstance()` singleton rather than `LoggerService` —
the documented logging exception in
[ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md).

**Only the CDN failure is logged.** It goes through `logger.warn`. The egress-IP chain is closed with
`Effect.orElse`, so a failure there is invisible — if detection has quietly stopped working, absence of logs
is not evidence.

## Testing

Both files have a co-located test. `detectCountry.test.ts` mocks `./utils/strategies` outright and asserts
only the fallthrough — including that a later strategy is *not* called once an earlier one answers.
`utils/strategies.test.ts` stubs `getCloudflareContext` and the global `fetch`, and covers each failure mode
separately, since every one of them has to produce `''` rather than an exception.

Both use the locale constants from `locales.ts` as country codes, which is a coincidence of spelling (`es`,
`de`, `fr`) and not a claim that locale and Country are the same thing — they are not, and the Country is
never inferred from the language.
