# src/infrastructure

## Purpose

The only layer that reaches outward. Everything that talks to a network, a database, a cookie jar, the
Cloudflare runtime or another thread lives here: SDK wrappers, server actions, middleware helpers, locale
routing, the `.well-known` endpoints and the calculations Web Worker. It holds no planning rule and no
orchestration — a use-case decides *what* happens, this layer knows *how* to reach the thing it happens to.

Because the planner runs in the browser ([ADR 0001](../../docs/adr/0001-planner-runs-in-the-browser.md)), the
server side of this layer is small: payments, one contact form, a Stripe webhook and some static rendering.
The largest single thing in here is a browser file — the Web Worker.

## Subdirectories

| Directory | Contents |
| --- | --- |
| `actions/` | The two `'use server'` entry points: `payment.ts` and `contact.ts`. They read request-scoped config and hand it to the matching operation under `api/operations/` |
| `api/` | The wire vocabulary for failures, the no-store response helper, and the operations both transports terminate. See [`api/CLAUDE.md`](./api/CLAUDE.md) |
| `clients/` | SDK wrappers — four Effect service tags plus four modules that are deliberately not services. See [`clients/CLAUDE.md`](./clients/CLAUDE.md) |
| `i18n/` | [`routing.ts`](./i18n/routing.ts) (next-intl routing, `localePrefix: 'as-needed'`), [`config.ts`](./i18n/config.ts) (request config + message loading), [`locales.ts`](./i18n/locales.ts) (the six codes), [`cookie.ts`](./i18n/cookie.ts) (`NEXT_LOCALE`), [`utils/url.ts`](./i18n/utils/url.ts) (`localePath`, `getLocaleFromPathname`, `localeAlternates`) |
| `images/` | [`loader.ts`](./images/loader.ts) — rewrites an image src to `/cdn-cgi/image/...`, the Cloudflare optimiser used in place of Next's built-in one ([ADR 0004](../../docs/adr/0004-cloudflare-workers-as-deployment-target.md)) |
| `markdown/` | [`buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts) — the Markdown twin of a page, served when the request asks for `text/markdown`. Translates through `createTranslator` over statically imported bundles, never `next-intl/server` — see *Gotchas* |
| `seo/` | [`buildMetadata.ts`](./seo/buildMetadata.ts) — the `Metadata` shape every route's `generateMetadata` fills in; [`routes.ts`](./seo/routes.ts) — `SITE_ROUTES`, the one list of pages and whether each is indexable |
| `proxy/` | Middleware helpers: `location.ts` (country detection + cookie) and [`cookie.ts`](./proxy/cookie.ts) (`user-country`, one week) |
| `services/` | Everything with a purpose but no SDK of its own: `contact/`, `countries/`, `env/`, `holidays/`, `location/`, `payments/`, `premium/`, `regions/`. Three carry their own guides — [holidays](./services/holidays/CLAUDE.md), [location](./services/location/CLAUDE.md), [payments](./services/payments/CLAUDE.md) |
| `well-known/` | [`apiCatalog.ts`](./well-known/apiCatalog.ts) (RFC 9727 linkset), [`mcpServerCard.ts`](./well-known/mcpServerCard.ts) (SEP-1649), [`agentSkillsIndex.ts`](./well-known/agentSkillsIndex.ts) — all three return a `NextResponse` directly |
| `workers/` | The calculations Web Worker and its message contract. See [`workers/CLAUDE.md`](./workers/CLAUDE.md) |
| [`errors.ts`](./errors.ts) | Every tagged error in the app — `DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError`, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError` |
| [`layers.ts`](./layers.ts) | `ApplicationLayer` — the four Live layers merged, provided at every entry point |

There is no `services/calendar/`. The planning engine is `@domain/calendar/`, and `FilterStrategy` is declared
there, not here.

## Layer rules

May import from `@application/*` (DTO types and schemas, use-cases) and — in `workers/` only — from
`@domain/calendar/*`. Must not import from `@ui/*`.

**Nothing here imports from `@ui/*`, and that is newly true.** [`clients/tutorial/driver/client.tsx`](./clients/tutorial/driver/client.tsx) used to
import two animated icons so the driver.js popover could render the app's own close button; it now takes the
element as an injected `closeIcon` config prop, and [`hooks/useTutorial.tsx`](../ui/hooks/useTutorial.tsx) in the UI layer — already on the
other side of the boundary — builds it and passes it to `start()`. A component import creeping back into the driver client
is the regression to watch for.

None of this is lint-enforced. Biome has no import-boundary rule; these are conventions upheld in review.

## Effect, and where it stops

Every server path that talks to Stripe, Turso or Resend is an Effect program with a typed error channel and
its dependencies injected as service tags
([ADR 0002](../../docs/adr/0002-effect-for-external-service-boundaries.md)). The program is *composed* in
`services/` and `@domain/payment/`, and *terminated* at an entry point — a route handler under `src/app/api/`
or a server action here — with `Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer), …))`.

Two things about that termination bite in practice:

**Providing `ApplicationLayer` builds all four clients, but building one reads no environment.** `Layer.mergeAll`
is not lazy per tag, so every entry point constructs all four. Each client reads its own configuration lazily,
inside the call, and reports a missing variable as its own tagged error — `DatabaseError`, `EmailError`,
`PaymentError` — which the entry point's `catchTags` map does see. That is deliberate and load-bearing: when
the layers threw at construction instead, a missing `RESEND_API_KEY` broke the payment route, which sends no
mail, and it broke it as an Effect *defect* that neither `catchTags` nor the trailing `catchAll` could map, so
it surfaced as a rejected promise rather than a status. Do not move a configuration read back up into a
`Layer.sync`.

**Work deferred with `after()` has to re-provide the layer.** Both server actions split their use-case into an
immediate result and a `deferred` Effect, hand the deferred half to `after()` and run it separately with
`Effect.provide(ApplicationLayer)`. The outer program has already been run by then; the deferred one carries
its requirements with it and would not compile otherwise.

**Logging is the documented exception.** BetterStack has a tag *and* a plain singleton, and the singleton is
what [`getCountries.ts`](./services/countries/getCountries.ts), [`getRegions.ts`](./services/regions/getRegions.ts), the country-detection strategies and the browser Stripe client use —
anywhere there is no layer to provide. "All external calls go through Effect" is false for logging, on
purpose ([ADR 0002](../../docs/adr/0002-effect-for-external-service-boundaries.md)).

## The Cloudflare context is request-scoped

`getCloudflareContext()` is only valid inside a request
([ADR 0004](../../docs/adr/0004-cloudflare-workers-as-deployment-target.md)). Entry points may call it;
use-cases may not, and receive configuration as plain values instead — `contact.ts` reads
`env.NEXT_PUBLIC_SITE_URL` and `env.NEXT_PUBLIC_CONTACT_EMAIL` and passes them down as a plain object.

Five places inside this layer read it directly, and each has a reason: [`actions/contact.ts`](./actions/contact.ts) (config for the
use-case), [`services/payments/rateLimit.ts`](./services/payments/rateLimit.ts) (the `PAYMENT_RATE_LIMITER` binding),
[`services/env/getPublicEnv.ts`](./services/env/getPublicEnv.ts) (a `'use cache'` function, so it uses the `{ async: true }` form),
[`clients/logging/better-stack/client.ts`](./clients/logging/better-stack/client.ts) (the execution context for `waitUntil`, wrapped in a `try` that
returns `undefined` so logging still works off-request), and [`services/location/utils/strategies.ts`](./services/location/utils/strategies.ts) (only
`env.NEXT_PUBLIC_SITE_URL`, to build the CDN trace URL). The signal that makes country detection cheap is not
the Cloudflare context at all: it is the `cf-ipcountry` request header, read by `detectCountryFromHeaders`,
which touches no context and is why the common path needs no geolocation service.

## Two transports per operation, one implementation

Payment creation and contact submission are each reachable two ways: a route handler under `src/app/api/` and
a server action here. They no longer restate the operation. Both call the module under
[`api/operations/`](./api/CLAUDE.md), which owns the rate limit, the use-case, the deferred write and the
failure-to-status mapping, and answers a transport-free `{ status, body }`. The action drops the status; the
route puts it on a `NextResponse`.

[`actions/payment.ts`](./actions/payment.ts) cannot forget to rate-limit before creating a payment, because it no longer does either —
that ordering lives in the operation and is asserted once. The two used to be kept equal by grep, and had
already drifted over how a missing IP header was recorded.

## Gotchas

- **"Worker" means two different things in this repo.** `workers/` is a browser Web Worker. The Cloudflare
  Worker is the deployment target, configured in [`wrangler.toml`](../../wrangler.toml) and built by OpenNext. Nothing in `workers/`
  runs on the server.
- **`getCountries.ts` and `getRegions.ts` call `getBetterStackInstance()` at module scope.** Importing either
  constructs the logger. The Logtail transport itself is created lazily on the first log, so the import does
  not require the BetterStack environment variables — but it does pull the logging client into whatever bundle
  imports them, and [`Countries.tsx`](../ui/modules/sidebar/components/Countries.tsx) imports `getCountries.ts` from the UI layer.
- **Country detection sits in front of every HTML response.** [`proxy/location.ts`](./proxy/location.ts) re-sets an existing
  `user-country` cookie instead of re-running [`detectCountry.ts`](./services/location/detectCountry.ts), which is a subrequest with its own timeout.
  Writing back a value it already has is not redundant: it slides the week-long expiry forward on every
  visit, so the chain stays off the hot path for as long as the visitor keeps coming back. Do not
  "simplify" that branch away.
- **`PREMIUM_SESSION_LIFETIME_SECONDS` in `cookie.ts` is the single source of truth for how long Premium
  lasts.** [`session.ts`](./services/premium/session.ts) derives the JWT expiry from it, so a cookie can never outlive the token it carries.
  It lives beside the cookie rather than beside the token because the cookie's `maxAge` is what fixes the
  unit — seconds — for both. Do not reintroduce a second constant: they were separate before, and nothing
  would have caught them drifting apart.
- **Turso opens a connection per call.** `query`, `execute` and `batch` each call `connect()` themselves, so
  two calls are two connections and nothing spans them transactionally.
- **A route handler must not translate through `next-intl/server`.** `getTranslations` memoises its message
  loading, and on Cloudflare that cache outlives the request that filled it — the second request onward throws
  `Cannot perform I/O on behalf of a different request`, which is workerd refusing to let one request touch an
  I/O object another created. `/api/markdown` did exactly this: the first request after each deploy answered
  200 and every one after it answered 500, which read as flakiness because only some tests ran second.
  `buildMarkdownPage.ts` uses `createTranslator` from `next-intl` over the six statically imported bundles
  instead — no cache, no request scope, same compile-time checking of message keys — and its test asserts the
  module never imports `next-intl/server` again. Nothing reproduces this locally: Node has no such rule, and
  20 consecutive requests to `next start` all succeed.

## Testing

Every module with behaviour has a co-located `.test.ts`. Two files have none and should not grow one:
[`workers/types.ts`](./workers/types.ts) is types only, and [`api/errors.ts`](./api/errors.ts) is a const map whose contract is asserted through the
route tests instead — see [`api/CLAUDE.md`](./api/CLAUDE.md). Tests substitute a service tag with
`Layer.succeed(Tag, { … })` — no test constructs a real Stripe, Turso or Resend client.

[`layers.test.ts`](./layers.test.ts) is the shape to copy when a test has to import something that transitively pulls in
`layers.ts`: it mocks all four Live layers with `Layer.empty`, because constructing the real ones would demand
the environment variables. Assert against `ApiError.*` rather than string literals in route tests, so a code
rename does not need a test rewrite.
