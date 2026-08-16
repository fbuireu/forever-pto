# apps/web/src/infrastructure

## Purpose

The only layer that reaches outward. Everything that talks to a network, a database, a cookie jar, the
Cloudflare runtime or another thread lives here: SDK wrappers, server actions, middleware helpers, locale
routing, the `.well-known` endpoints and the calculations Web Worker. It holds no planning rule and no
orchestration — a use-case decides *what* happens, this layer knows *how* to reach the thing it happens to.

Because the planner runs in the browser ([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)), the
server side of this layer is small: payments, one contact form, a Stripe webhook and some static rendering.
The largest single thing in here is a browser file — the Web Worker.

## Subdirectories

| Directory | Contents |
| --- | --- |
| `actions/` | The two `'use server'` entry points: `payment.ts` and `contact.ts`. They read request-scoped config and hand it to the matching operation under `api/operations/` |
| `api/` | The wire vocabulary for failures, the no-store response helper, and the operations both transports terminate. See [`api/CLAUDE.md`](./api/CLAUDE.md) |
| `clients/` | SDK wrappers — four Effect service tags plus four modules that are deliberately not services. See [`clients/CLAUDE.md`](./clients/CLAUDE.md) |
| `i18n/` | `routing.ts` (next-intl routing, `localePrefix: 'as-needed'`), `config.ts` (request config + message loading), `locales.ts` (the six codes and `LOCALE_COOKIE`), `cookie.ts` (writes `NEXT_LOCALE` with the flags next-intl's own cookie lacks), `utils/url.ts` (`localePath`, `resolveLocale`, `getLocaleFromPathname`, `routePathFromPathname`, `localeFromAcceptLanguage`, `localeAlternates`) |

**`LOCALES` is `as const`, and until it was, `Locale` was `string`.** The array was an unannotated literal,
so TypeScript widened it to `string[]`, and `AppConfig['Locale']` in `environment.d.ts` reads
`(typeof routing.locales)[number]` — which resolved to `string`. Eighteen files annotated a type that carried
no information: `hasLocale(LOCALES, x)` narrowed `x` to `string`, and every `{ locale: Locale }` route param
was `{ locale: string }`. This was proven with a compiler probe rather than read off the source, because it
is invisible at every call site.

The live consequence was in `markdown/buildMarkdownPage.ts`, which keys `MESSAGES` by that value with
`noUncheckedIndexedAccess` off: adding a seventh locale and forgetting the row compiled, then handed
`createTranslator` an undefined bundle at runtime. `MESSAGES` is `Record<LocaleCode, …>` now, so the same
omission is a compile error — verified by adding a `pt` locale and watching it fail, which also caught the
missing `languages.pt` key that `useLanguages`'s now-deleted `as Parameters<typeof t>[0]` cast had been
hiding. `SITE_ROUTES` already had this discipline; the locales never did.

`isLocale` sits beside the codes rather than being derived from `resolveLocale`, because the Web Worker needs
it and `resolveLocale` pulls `routing`. The worker narrows the incoming `locale` with it exactly as it
already narrows `strategy` with `isFilterStrategy` — the wire value is genuinely unvalidated there, which is
the one place `string` is the honest type.

**`resolveLocale` is the one place a candidate becomes a locale.** `hasLocale(LOCALES, x) ? x : routing.defaultLocale`
was written out verbatim at three sites — the request config, the activate route's `?locale=` and the
path-segment reader — and a fourth, `global-not-found.tsx`, hand-rolled a header→cookie→`Accept-Language`
chain that existed nowhere else and was reachable only through a page most users never see. The
`Accept-Language` half is `localeFromAcceptLanguage` now and answers `undefined` rather than the default, so
the caller decides the fallback and the precedence is assertable without rendering a document.
| `images/` | `loader.ts` — rewrites an image src to `/cdn-cgi/image/...`, the Cloudflare optimiser used in place of Next's built-in one ([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)) |
| `markdown/` | `buildMarkdownPage.ts` — the Markdown twin of a page, served when the request asks for `text/markdown`. Translates through `createTranslator` over statically imported bundles, never `next-intl/server` — see *Gotchas* |
| `seo/` | `buildMetadata.ts` — the `Metadata` shape every route's `generateMetadata` fills in; `routeMetadata.ts` — that `generateMetadata`, built from a route's own row so a route file is one line; `routes.ts` — `SITE_ROUTES`, the one list of pages and whether each is indexable, plus `routeFor`, the total lookup keyed by the table's own literal paths |
| `proxy/` | Middleware helpers: `location.ts` (country detection + cookie) and `cookie.ts` (`user-country`, one week) |
| `services/` | Everything with a purpose but no SDK of its own: `contact/`, `countries/`, `env/`, `holidays/`, `location/`, `payments/`, `premium/`, `regions/`. Three carry their own guides — [holidays](./services/holidays/CLAUDE.md), [location](./services/location/CLAUDE.md), [payments](./services/payments/CLAUDE.md) |
| `well-known/` | `slugs.ts` (the three slugs, the shared cache header, `wellKnownUrl`), `documents.ts` (slug → content type and builder), and the builders `apiCatalog.ts` (RFC 9727 linkset), `mcpServerCard.ts` (SEP-1649) and `agentSkillsIndex.ts` — each returning a plain object, with the route owning the response envelope |
| `workers/` | The calculations Web Worker and its message contract. See [`workers/CLAUDE.md`](./workers/CLAUDE.md) |
| `errors.ts` | Every tagged error in the app — `DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError`, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError` |
| `layers.ts` | `ApplicationLayer` — the four Live layers merged, provided at every entry point |

There is no `services/calendar/`. The planning engine is `@domain/calendar/`, and `FilterStrategy` is declared
there, not here.

## Layer rules

May import from `@application/*` (DTO types and schemas, use-cases) and — in `workers/` only — from
`@domain/calendar/*`. Must not import from `@ui/*`.

**Nothing here imports from `@ui/*`, and that is newly true.** `clients/tutorial/driver/client.tsx` used to
import two animated icons so the driver.js popover could render the app's own close button; it now takes the
element as an injected `closeIcon` config prop, and `hooks/useTutorial.tsx` in the UI layer — already on the
other side of the boundary — builds it and passes it to `start()`. A component import creeping back into the driver client
is the regression to watch for.

None of this is lint-enforced. Biome has no import-boundary rule; these are conventions upheld in review.

## Effect, and where it stops

Every server path that talks to Stripe, Turso or Resend is an Effect program with a typed error channel and
its dependencies injected as service tags
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)). The program is *composed* in
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
what `getCountries.ts`, `getRegions.ts`, the country-detection strategies and the browser Stripe client use —
anywhere there is no layer to provide. "All external calls go through Effect" is false for logging, on
purpose ([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)).

## The Cloudflare context is request-scoped

`getCloudflareContext()` is only valid inside a request
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). Entry points may call it;
use-cases may not, and receive configuration as plain values instead — `contact.ts` reads
`env.NEXT_PUBLIC_SITE_URL` and `env.NEXT_PUBLIC_CONTACT_EMAIL` and passes them down as a plain object.

Five places inside this layer read it directly, and each has a reason:
`services/env/getRequestPublicEnv.ts` (the per-request config both contact transports pass down),
`services/payments/rateLimit.ts` (the `PAYMENT_RATE_LIMITER` binding),
`services/env/getPublicEnv.ts` (a `'use cache'` function, so it uses the `{ async: true }` form),
`clients/logging/better-stack/client.ts` (the execution context for `waitUntil`, wrapped in a `try` that
returns `undefined` so logging still works off-request), and `services/location/utils/strategies.ts` (only
`env.NEXT_PUBLIC_SITE_URL`, to build the CDN trace URL). The signal that makes country detection cheap is not
the Cloudflare context at all: it is the `cf-ipcountry` request header, read by `detectCountryFromHeaders`,
which touches no context and is why the common path needs no geolocation service.

**There are two readers of the same two variables, and the difference is *when* they are asked.**
`getPublicEnv` is the cached, build-safe one — `'use cache'`, `cacheLife('days')`, the `{ async: true }`
context — and `sitemap.ts`, `robots.ts` and the `metadata.ts` files use it because they are evaluated outside
a request. `getRequestPublicEnv` beside it is the synchronous, per-request one, and the two contact
transports use it. They each hand-mapped those four lines before, which is the residue of exactly the drift
`operations/` exists to prevent.

They are deliberately not merged. Pointing the transports at `getPublicEnv` would change both the context
form and the cache lifetime on the path that decides where a contact email is sent, and that is the same
class of question as the `NEXT_PUBLIC_SITE_URL` resolution below — verifiable only against a real build,
which is currently the thing that cannot be run locally. One reader per timing, one place each.

`getPublicEnv` carries `'use cache'` with `cacheLife('days')`, and neither is visible at its signature. The
lifetime is safe because both values are deploy-time constants — a caller cannot observe a stale one. Its
return type `PublicEnv` is exported and is the config shape `api/operations/contact.ts` takes, so the two
cannot drift into describing different objects.

## Two transports per operation, one implementation

Payment creation and contact submission are each reachable two ways: a route handler under `src/app/api/` and
a server action here. They no longer restate the operation. Both call the module under
[`api/operations/`](./api/CLAUDE.md), which owns the rate limit, the use-case, the deferred write and the
failure-to-status mapping, and answers a transport-free `{ status, body }`. The action drops the status; the
route puts it on a `NextResponse`.

`actions/payment.ts` cannot forget to rate-limit before creating a payment, because it no longer does either —
that ordering lives in the operation and is asserted once. The two used to be kept equal by grep, and had
already drifted over how a missing IP header was recorded.

## Gotchas

- **"Worker" means two different things in this repo.** `workers/` is a browser Web Worker. The Cloudflare
  Worker is the deployment target, configured in `wrangler.toml` and built by OpenNext. Nothing in `workers/`
  runs on the server.
- **An option list is collated by `collateByLabel`, and only one of the two callers has a locale to give
  it.** `getCountries` localises its labels through `i18n-iso-countries` and then has to collate them in that
  same locale — it used to end in a bare `localeCompare` with no argument, so every non-English visitor got a
  Country list ordered by the runtime default, which on the deployed Worker is not theirs. The two services
  each held their own copy of that sort, which is how one of them came to be wrong. `getRegions` passes no
  locale on purpose: its labels come from `date-holidays`' `getStates()` in whatever language that package
  emits, and it is reached from the location store and from `getHolidays`, neither of which carries one.
  Giving it a locale means threading one from both call sites first.
- **`getCountries.ts` and `getRegions.ts` call `getBetterStackInstance()` at module scope.** Importing either
  constructs the logger. The Logtail transport itself is created lazily on the first log, so the import does
  not require the BetterStack environment variables — but it does pull the logging client into whatever bundle
  imports them, and `Countries.tsx` imports `getCountries.ts` from the UI layer.
- **Country detection sits in front of every HTML response.** `proxy/location.ts` re-sets an existing
  `user-country` cookie instead of re-running `detectCountry.ts`, which is a subrequest with its own timeout.
  Writing back a value it already has is not redundant: it slides the week-long expiry forward on every
  visit, so the chain stays off the hot path for as long as the visitor keeps coming back. Do not
  "simplify" that branch away.
- **`PREMIUM_SESSION_LIFETIME_SECONDS` in `cookie.ts` is the single source of truth for how long Premium
  lasts.** `session.ts` derives the JWT expiry from it, so a cookie can never outlive the token it carries.
  It lives beside the cookie rather than beside the token because the cookie's `maxAge` is what fixes the
  unit — seconds — for both. Do not reintroduce a second constant: they were separate before, and nothing
  would have caught them drifting apart.
- **`execute` answers with `rowsAffected`, which is what makes a guarded write usable.** It returned `void`,
  so a caller wanting to know whether its `UPDATE ... WHERE <guard>` matched had to read the row first — and
  with a connection per call, that read guarded nothing. The payments repository is the consumer: see
  [`services/payments/CLAUDE.md`](./services/payments/CLAUDE.md).
- **Turso opens a connection per call.** `query` and `execute` each call `connect()` themselves, so
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

Every module with behaviour has a co-located `.test.ts`. Five files have none, and each is one of three
things: types only (`workers/types.ts`, `services/holidays/source/types.ts`); a const map whose contract is asserted through the route tests instead
(`api/errors.ts` — see [`api/CLAUDE.md`](./api/CLAUDE.md)); or itself a test double
(`services/holidays/source/fixture.ts`, the second adapter at the `HolidaySource` seam, exercised by every
test that uses it).

**`seo/buildMetadata.ts` and `services/holidays/source/dateHolidays.ts` were a fourth kind — untested — and
are not any more.** `buildMetadata` was reached only through the seven route `metadata.test.ts` files, and
every twitter/images assertion in them was positive and lived in the two indexable routes, so both
`indexable &&` guards could be deleted and the suite stayed green while a noindex legal page began
advertising an Open Graph image and a `summary_large_image` card. `dateHolidays` is the adapter that decides
the two-year Planning Window and whether a Region-scoped lookup is constructed at all; its co-located test
asserts the *call pattern* — which years are asked for, how many `Holidays` are built, that `getStates` is
given the lower-cased Country — rather than the shape `date-holidays` returns, which is the only kind of
claim a mock of that package can honestly make.

Tests substitute a service tag with
`Layer.succeed(Tag, { … })` — no test constructs a real Stripe, Turso or Resend client.

`layers.test.ts` is the shape to copy when a test has to import something that transitively pulls in
`layers.ts`: it mocks all four Live layers with `Layer.empty`, because constructing the real ones would demand
the environment variables. Assert against `ApiError.*` rather than string literals in route tests, so a code
rename does not need a test rewrite.
