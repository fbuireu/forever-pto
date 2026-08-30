# apps/web/src/infrastructure

## Purpose

The only layer that reaches outward. Everything that talks to a network, a database, a cookie jar, the
Cloudflare runtime or another thread lives here: SDK wrappers, server actions, proxy helpers, locale
routing, the `.well-known` endpoints and the calculations Web Worker. It holds no planning rule and no
orchestration: a use-case decides *what* happens, this layer knows *how* to reach the thing it happens to.

Because the planner runs in the browser ([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)), the
server side of this layer is small: payments, one contact form, a Stripe webhook and some static rendering.
The largest single thing in here is a browser file: the Web Worker.

## Subdirectories

| Directory | Contents |
| --- | --- |
| `actions/` | The two `'use server'` entry points: `payment.ts` and `contact.ts`. They read request-scoped config and hand it to the matching operation under [`api/operations/`](./api/operations) |
| `api/` | The wire vocabulary for failures, the no-store response helper, and the operations both transports terminate. See [`api/CLAUDE.md`](./api/CLAUDE.md) |
| `clients/` | SDK wrappers: four Effect service tags plus four modules that are deliberately not services. See [`clients/CLAUDE.md`](./clients/CLAUDE.md) |
| `i18n/` | [`routing.ts`](./i18n/routing.ts) (next-intl routing, `localePrefix: 'as-needed'`), [`config.ts`](./i18n/config.ts) (request config + message loading), [`locales.ts`](./i18n/locales.ts) (the six codes and `LOCALE_COOKIE`), [`cookie.ts`](./i18n/cookie.ts) (`LOCALE_COOKIE_POLICY`, the one statement of the `NEXT_LOCALE` attributes, plus `setLocaleCookie`), [`utils/url.ts`](./i18n/utils/url.ts) (`localePath`, `resolveLocale`, `getLocaleFromPathname`, `routePathFromPathname`, `localeFromAcceptLanguage`, `localeAlternates`) |

**`LOCALES` is `as const`, and until it was, `Locale` was `string`.** The array was an unannotated literal,
so TypeScript widened it to `string[]`, and `AppConfig['Locale']` in [`environment.d.ts`](../../environment.d.ts) reads
`(typeof routing.locales)[number]`, which resolved to `string`. Eighteen files annotated a type that carried
no information: `hasLocale(LOCALES, x)` narrowed `x` to `string`, and every `{ locale: Locale }` route param
was `{ locale: string }`. This was proven with a compiler probe rather than read off the source, because it
is invisible at every call site.

The live consequence was in [`markdown/buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts), which keys `MESSAGES` by that value with
`noUncheckedIndexedAccess` off: adding a seventh locale and forgetting the row compiled, then handed
`createTranslator` an undefined bundle at runtime. `MESSAGES` is `Record<LocaleCode, …>` now, so the same
omission is a compile error, verified by adding a `pt` locale and watching it fail, which also caught the
missing `languages.pt` key that `useLanguages`'s now-deleted `as Parameters<typeof t>[0]` cast had been
hiding. `SITE_ROUTES` already had this discipline; the locales never did.

`isLocale` sits beside the codes rather than being derived from `resolveLocale`, because the Web Worker needs
it and `resolveLocale` pulls `routing`. The worker narrows the incoming `locale` with it exactly as it
already narrows `strategy` with `isFilterStrategy`; the wire value is genuinely unvalidated there, which is
the one place `string` is the honest type.

**`NEXT_LOCALE`'s attributes are stated once, in `cookie.ts`, and `routing.ts` hands that same object to
next-intl.** It has to be one object because *two* writers use it: the proxy writes the cookie on the
response, and next-intl's `syncLocaleCookie` writes it from `document.cookie` when a language switcher
navigates without a round trip: [`application/i18n/navigation.ts`](../application/i18n/navigation.ts)'s `createNavigation(routing)` passes
`routing.localeCookie` straight into it. The two were written separately and disagreed on two flags, and
one of them was fatal: `setLocaleCookie` added `httpOnly`, which a browser honours by **discarding** any
later `document.cookie` write to that name on a matching domain and path. So a soft locale switch never
persisted. The es→en direction could not recover either, because `en` is the unprefixed default under
`localePrefix: 'as-needed'`; with no prefix to read, next-intl's `resolveLocale` fell to the stale cookie
and redirected back to `/es`. `httpOnly` is gone; there is nothing secret in a language preference.

`path: '/'` is the half that is still load-bearing. next-intl's middleware defaults it to
`request.nextUrl.basePath || undefined`, which on this app is `undefined`, and a cookie set with no `path`
takes the request's own directory, so a switch made on `/es/planner` would have been scoped to `/es` while
the client-side write scoped itself to `/`. Two cookies, one name. Naming `path` in the policy is what makes
both writers produce the same one.

**`resolveLocale` is the one place a candidate becomes a locale.** `hasLocale(LOCALES, x) ? x : routing.defaultLocale`
was written out verbatim at three sites (the request config, the activate route's `?locale=` and the
path-segment reader), and a fourth, [`global-not-found.tsx`](../app/global-not-found.tsx), hand-rolled a header→cookie→`Accept-Language`
chain that existed nowhere else and was reachable only through a page most users never see. The
`Accept-Language` half is `localeFromAcceptLanguage` now and answers `undefined` rather than the default, so
the caller decides the fallback and the precedence is assertable without rendering a document.
| `markdown/` | `buildMarkdownPage.ts`: the Markdown twin of a page, served when the request asks for `text/markdown`. Translates through `createTranslator` over statically imported bundles, never `next-intl/server`; see *Gotchas*. [`twin.ts`](./markdown/twin.ts) beside it holds how the twin is *requested* and *cached*: the route path, the `Accept` token, the `x-markdown-path` header the proxy sets, and `markdownTwinHeaders({ found })`. Both the proxy and the route read it, which is what stopped the policy being a guess made before the lookup; see [`../app/CLAUDE.md`](../app/CLAUDE.md) |
| `seo/` | [`buildMetadata.ts`](./seo/buildMetadata.ts): the `Metadata` shape every route's `generateMetadata` fills in; [`routeMetadata.ts`](./seo/routeMetadata.ts): that `generateMetadata`, built from a route's own row so a route file is one line; [`routes.ts`](./seo/routes.ts): `SITE_ROUTES`, the one list of pages and whether each is indexable, plus `routeFor`, the total lookup keyed by the table's own literal paths |
| `proxy/` | Middleware helpers: `location.ts` (country detection + cookie) and [`cookie.ts`](./proxy/cookie.ts) (`user-country`, one week) |
| `services/` | Everything with a purpose but no SDK of its own: `contact/`, `countries/`, `env/`, `holidays/`, `location/`, `payments/`, `premium/`, `regions/`. Three carry their own guides: [holidays](./services/holidays/CLAUDE.md), [location](./services/location/CLAUDE.md), [payments](./services/payments/CLAUDE.md) |
| `well-known/` | [`slugs.ts`](./well-known/slugs.ts) (the three slugs, the shared cache header, `wellKnownUrl`), [`documents.ts`](./well-known/documents.ts) (slug → content type and builder), and the builders [`apiCatalog.ts`](./well-known/apiCatalog.ts) (RFC 9727 linkset), [`mcpServerCard.ts`](./well-known/mcpServerCard.ts) (SEP-1649) and [`agentSkillsIndex.ts`](./well-known/agentSkillsIndex.ts), each returning a plain object, with the route owning the response envelope |
| `workers/` | The calculations Web Worker and its message contract. See [`workers/CLAUDE.md`](./workers/CLAUDE.md) |
| [`errors.ts`](./errors.ts) | Every tagged error in the app: `DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError`, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError` |
| [`layers.ts`](./layers.ts) | `ApplicationLayer`: the four Live layers merged, provided at every entry point |

There is no `services/calendar/`. The planning engine is `@domain/calendar/`, and `FilterStrategy` is declared
there, not here.

## Layer rules

May import from `@application/*` (DTO types and schemas, use-cases) and from `@domain/*`, which is narrower in
practice than it reads and is enumerated below. Must not import a React component, a style or an asset out of
`@ui/*`.

**Both halves of that rule used to be stated more tightly than the tree keeps them, and both were checked
against the tree rather than against the sentence.** What it said was *in `workers/` only, from
`@domain/calendar/*`* and *must not import from `@ui/*`*, with a paragraph asserting that nothing here did.
Neither survived a walk of the imports.

**`@domain/*` is reached from four files, and one of them is neither in `workers/` nor from `calendar/`.**
[`workers/types.ts`](./workers/types.ts), [`workers/utils/serializers.ts`](./workers/utils/serializers.ts) and
[`workers/worker.ts`](./workers/worker.ts) take the calendar types and `runPlanningPipeline`, which is the
documented case. [`services/payments/repository.ts`](./services/payments/repository.ts) takes
`PaymentStatus` from `@domain/payment/events/types`, as `import type`, because the column it writes is that
union and the alternative is a second declaration of the same seven strings one layer down. That is the whole
of the exception: a **type** out of the payment context, into the module that persists it. Anything with a
runtime dependency, or anything out of `@domain/calendar/` outside `workers/`, is not covered by it.

**Seven imports across two files reach `apps/web/src/ui/`, through the `@i18n` shorthand.**
[`i18n/config.ts`](./i18n/config.ts) loads a locale bundle dynamically and
[`markdown/buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts) imports all six statically, both as
`@i18n/messages/<locale>.json`. `@i18n/*` resolves to `./src/ui/i18n/*`, so those are `infrastructure -> ui`
edges; the old rule read the literal specifier `@ui/` and the shorthand walked straight past it. They are
tolerated rather than endorsed: the bundles are translation **data**, not UI, no component is pulled in
behind them, and the alternative is moving `src/ui/i18n/messages/` to a fourth top-level tier, which is the
move [ADR 0012](../../../../adr/0012-shared-date-helpers-stay-in-the-application-layer.md) already weighed
and rejected for the date helpers. The rule that matters is the one the sentence was reaching for: **no
component, no style, no asset**. `tests/docs-consistency.test.ts` reads all four aliases that land inside
`src/ui/` (`@ui/`, `@i18n/`, `@styles/`, `@assets/`) and fails on any importer here outside those two files.

**No React component reaches this layer, and that part is newly true.**
[`clients/tutorial/driver/client.tsx`](./clients/tutorial/driver/client.tsx) used to import two animated
icons so the driver.js popover could render the app's own close button; it now takes the element as an
injected `closeIcon` config prop, and [`hooks/useTutorial.tsx`](../ui/hooks/useTutorial.tsx) in the UI layer,
already on the other side of the boundary, builds it and passes it to `start()`. A component import creeping
back into the driver client is the regression to watch for, and it is the one the suite now catches rather
than review.

Biome still has no import-boundary rule, so everything above holds by review except the two shapes the
contract suite reads: the `src/ui/` reach listed here, and the layer graph as a whole, which
`tests/docs-consistency.test.ts` compares against the table published in the architecture overview.

## Effect, and where it stops

Every server path that talks to Stripe, Turso or Resend is an Effect program with a typed error channel and
its dependencies injected as service tags
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)). The program is *composed* in
`services/` and `@domain/payment/`, and *terminated* at an entry point (a route handler under `src/app/api/`
or a server action here) with `Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer), …))`.

Two things about that termination bite in practice:

**Providing `ApplicationLayer` builds all four clients, but building one reads no environment.** `Layer.mergeAll`
is not lazy per tag, so every entry point constructs all four. Each client reads its own configuration lazily,
inside the call, and reports a missing variable as its own tagged error (`DatabaseError`, `EmailError`,
`PaymentError`), which the entry point's `catchTags` map does see. That is deliberate and load-bearing: when
the layers threw at construction instead, a missing `RESEND_API_KEY` broke the payment route, which sends no
mail, and it broke it as an Effect *defect* that neither `catchTags` nor the trailing `catchAll` could map, so
it surfaced as a rejected promise rather than a status. Do not move a configuration read back up into a
`Layer.sync`.

**Work deferred with `after()` has to re-provide the layer.** Both server actions split their use-case into an
immediate result and a `deferred` Effect, hand the deferred half to `after()` and run it separately with
`Effect.provide(ApplicationLayer)`. The outer program has already been run by then; the deferred one carries
its requirements with it and would not compile otherwise.

**Logging is the documented exception.** BetterStack has a tag *and* a plain singleton, and the singleton is
what [`getCountries.ts`](./services/countries/getCountries.ts), [`getRegions.ts`](./services/regions/getRegions.ts), the country-detection strategies and the Zustand stores use,
anywhere there is no layer to provide. The browser Stripe client was on that list until it stopped logging
at all: it is now a memoised `loadStripe` and nothing else. "All external calls go through Effect" is false for logging, on
purpose ([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)).

## The Cloudflare context is request-scoped

`getCloudflareContext()` is only valid inside a request
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). Entry points may call it;
use-cases may not, and receive configuration as plain values instead: `contact.ts` reads
`env.NEXT_PUBLIC_SITE_URL` and `env.NEXT_PUBLIC_CONTACT_EMAIL` and passes them down as a plain object.

Five places inside this layer read it directly, and each has a reason:
[`services/env/getRequestPublicEnv.ts`](./services/env/getRequestPublicEnv.ts) (the per-request config both contact transports pass down),
[`services/payments/rateLimit.ts`](./services/payments/rateLimit.ts) (the `PAYMENT_RATE_LIMITER` binding),
[`services/env/getPublicEnv.ts`](./services/env/getPublicEnv.ts) (a `'use cache'` function, so it uses the `{ async: true }` form),
[`clients/logging/better-stack/client.ts`](./clients/logging/better-stack/client.ts) (the execution context for `waitUntil`, wrapped in a `try` that
returns `undefined` so logging still works off-request), and [`services/location/utils/strategies.ts`](./services/location/utils/strategies.ts) (only
`env.NEXT_PUBLIC_SITE_URL`, to build the CDN trace URL). The signal that makes country detection cheap is not
the Cloudflare context at all: it is the `cf-ipcountry` request header, read by `detectCountryFromHeaders`,
which touches no context and is why the common path needs no geolocation service.

**There are two readers of the same two variables, and the difference is *when* they are asked.**
`getPublicEnv` is the cached, build-safe one (`'use cache'`, `cacheLife('days')`, the `{ async: true }`
context), and [`sitemap.ts`](../app/sitemap.ts), [`robots.ts`](../app/robots.ts) and every route's `generateMetadata` use it because they are evaluated outside
a request. `getRequestPublicEnv` beside it is the synchronous, per-request one, and the two contact
transports use it. They each hand-mapped those four lines before, which is the residue of exactly the drift
`operations/` exists to prevent.

They are deliberately not merged. Pointing the transports at `getPublicEnv` would change both the context
form and the cache lifetime on the path that decides where a contact email is sent, and that is the same
class of question as the `NEXT_PUBLIC_SITE_URL` resolution below, verifiable only against a real build,
which is currently the thing that cannot be run locally. One reader per timing, one place each.

`getPublicEnv` carries `'use cache'` with `cacheLife('days')`, and neither is visible at its signature. The
lifetime is safe because both values are deploy-time constants; a caller cannot observe a stale one. Its
return type `PublicEnv` is exported and is the config shape [`api/operations/contact.ts`](./api/operations/contact.ts) takes, so the two
cannot drift into describing different objects.

## Two transports per operation, one implementation

Payment creation and contact submission are each reachable two ways: a route handler under `src/app/api/` and
a server action here. They no longer restate the operation. Both call the module under
[`api/operations/`](./api/CLAUDE.md), which owns the rate limit, the use-case, the deferred write and the
failure-to-status mapping, and answers a transport-free `{ status, body }`. The action drops the status; the
route puts it on a `NextResponse`.

[`actions/payment.ts`](./actions/payment.ts) cannot forget to rate-limit before creating a payment, because it no longer does either:
that ordering lives in the operation and is asserted once. The two used to be kept equal by grep, and had
already drifted over how a missing IP header was recorded.

## Gotchas

- **"Worker" means two different things in this repo.** `workers/` is a browser Web Worker. The Cloudflare
  Worker is the deployment target, configured in `wrangler.toml` and built by OpenNext. Nothing in `workers/`
  runs on the server.
- **An option list is collated by `collateByLabel`, and only one of the two callers has a locale to give
  it.** `getCountries` localises its labels through `i18n-iso-countries` and then has to collate them in that
  same locale; it used to end in a bare `localeCompare` with no argument, so every non-English visitor got a
  Country list ordered by the runtime default, which on the deployed Worker is not theirs. The two services
  each held their own copy of that sort, which is how one of them came to be wrong. `getRegions` passes no
  locale on purpose: its labels come from `date-holidays`' `getStates()` in whatever language that package
  emits, and it is reached from the location store and from `getHolidays`, neither of which carries one.
  Giving it a locale means threading one from both call sites first.
- **`getCountries.ts` and `getRegions.ts` call `getBetterStackInstance()` at module scope.** Importing either
  constructs the logger. The Logtail transport itself is created lazily on the first log, so the import does
  not require the BetterStack environment variables, but it does pull the logging client into whatever bundle
  imports them, and [`Countries.tsx`](../ui/modules/sidebar/components/Countries.tsx) imports `getCountries.ts` from the UI layer.
- **Country detection sits in front of every HTML response.** [`proxy/location.ts`](./proxy/location.ts) re-sets an existing
  `user-country` cookie instead of re-running [`detectCountry.ts`](./services/location/detectCountry.ts), which is a subrequest with its own timeout.
  Writing back a value it already has is not redundant: it slides the week-long expiry forward on every
  visit, so the chain stays off the hot path for as long as the visitor keeps coming back. Do not
  "simplify" that branch away.
- **The Open Graph block declares the logo's real size, 256x256, and the Twitter card is `summary` because
  of it.** `buildMetadata` advertised 1200x630 for a file that has always been 256 pixels square, so any
  consumer trusting the declaration stretched a small square across a wide box, and `summary_large_image`
  needs at least 300 pixels of width, so the card actually rendered was never the card declared. There is no
  1200x630 asset in the tree to point at; until someone authors one, the file's own size is the only honest
  declaration. The two numbers are kept rather than dropped precisely because a declaration is the only thing
  a test can tie back to the asset: [`seo/buildMetadata.test.ts`](./seo/buildMetadata.test.ts) reads the PNG's
  IHDR (two big-endian `uint32`s at byte 16) from whatever `OG_IMAGE` names, resolved against `public/`, and
  asserts both the declared dimensions and the card that width can carry. Drop a real social card in and the
  card assertion goes red rather than leaving `summary` behind on a 1200-pixel image.
- **`verifySession` fails two ways under one tag, and the vocabulary lives in
  [`services/premium/sessionErrors.ts`](./services/premium/sessionErrors.ts) rather than in `session.ts`.**
  "Did not verify", meaning expired, malformed or signed by something else, is a `SessionError`, and the
  check-session `GET` clears the cookie and stays quiet. "Could not verify", meaning `JWT_SECRET` is absent, is a
  `SessionConfigurationError`, a subclass adding no members, so the `_tag`, `TaggedFailure` and
  `describeFailure` are all unchanged and only `isSessionConfigurationError` sees the difference. That branch
  keeps the cookie and logs at error. It is the
  [`serverService.ts`](./clients/payments/stripe/serverService.ts) `WebhookConfigurationError` shape, copied
  deliberately. `session.ts` keeps only the two Effects and hands `wrapSessionError` to both `catch`
  handlers, so the route can import the classification without importing `jose`. A rotated secret is not
  separable from a forged token and stays in the silent branch; [`../app/CLAUDE.md`](../app/CLAUDE.md)
  records why that is the end of it.
- **`PREMIUM_SESSION_LIFETIME_SECONDS` in `cookie.ts` is the single source of truth for how long Premium
  lasts.** [`session.ts`](./services/premium/session.ts) derives the JWT expiry from it, so a cookie can never outlive the token it carries.
  It lives beside the cookie rather than beside the token because the cookie's `maxAge` is what fixes the
  unit (seconds) for both. Do not reintroduce a second constant: they were separate before, and nothing
  would have caught them drifting apart.
- **`execute` answers with the number of rows the statement touched, which is what makes a guarded write
  usable.** It returned `void`, so a caller wanting to know whether its `UPDATE ... WHERE <guard>` matched had
  to read the row first, and with a connection per call that read guarded nothing. The count comes off the
  SDK's `changes`, **not** `rowsAffected`, which is not a field on what `run` answers and read as `undefined`
  for as long as it was there. The payments repository is the consumer: see
  [`services/payments/CLAUDE.md`](./services/payments/CLAUDE.md) and
  [`clients/CLAUDE.md`](./clients/CLAUDE.md).
- **Turso opens a connection per call, and every call closes the one it opened.** `query` and `execute` each
  call `connect()` themselves, so two calls are two connections and nothing spans them transactionally. Each
  also releases its server-side stream in a `finally`; nothing did before, and a Worker has no process exit to
  do it instead.
- **A route handler must not translate through `next-intl/server`.** `getTranslations` memoises its message
  loading, and on Cloudflare that cache outlives the request that filled it; the second request onward throws
  `Cannot perform I/O on behalf of a different request`, which is workerd refusing to let one request touch an
  I/O object another created. `/api/markdown` did exactly this: the first request after each deploy answered
  200 and every one after it answered 500, which read as flakiness because only some tests ran second.
  `buildMarkdownPage.ts` uses `createTranslator` from `next-intl` over the six statically imported bundles
  instead (no cache, no request scope, same compile-time checking of message keys), and its test asserts the
  module never imports `next-intl/server` again. Nothing reproduces this locally: Node has no such rule, and
  20 consecutive requests to `next start` all succeed.

## Testing

Every module with behaviour has a co-located `.test.ts`. Four files have none, and each is one of two
things: types only ([`workers/types.ts`](./workers/types.ts), [`services/holidays/source/types.ts`](./services/holidays/source/types.ts)); or itself a test double
([`services/holidays/source/fixture.ts`](./services/holidays/source/fixture.ts), the second adapter at the `HolidaySource` seam, exercised by every
test that uses it).

**[`api/errors.ts`](./api/errors.ts) was listed here as a third kind (a const map asserted through the route tests), and it is
not.** It has [`api/errors.test.ts`](./api/errors.test.ts) beside it, which is the only place the tag→status table belongs; the route
and action tests that restated it row by row have been cut back to what each transport alone decides. See
[`api/CLAUDE.md`](./api/CLAUDE.md).

**`seo/buildMetadata.ts` and [`services/holidays/source/dateHolidays.ts`](./services/holidays/source/dateHolidays.ts) were a fourth kind (untested) and
are not any more.** `buildMetadata` was reached only through the seven route `metadata.test.ts` files that existed then, and
every twitter/images assertion in them was positive and lived in the two indexable routes, so both
`indexable &&` guards could be deleted and the suite stayed green while a noindex legal page began
advertising an Open Graph image and a Twitter card. `dateHolidays` is the adapter that decides
the two-year Planning Window and whether a Region-scoped lookup is constructed at all; its co-located test
asserts the *call pattern* (which years are asked for, how many `Holidays` are built, that `getStates` is
given the lower-cased Country) rather than the shape `date-holidays` returns, which is the only kind of
claim a mock of that package can honestly make.

Tests substitute a service tag with
`Layer.succeed(Tag, { … })`; no test constructs a real Stripe, Turso or Resend client.

[`layers.test.ts`](./layers.test.ts) is the shape to copy when a test has to import something that transitively pulls in
`layers.ts`: it mocks all four Live layers with `Layer.empty`, because constructing the real ones would demand
the environment variables. Assert against `ApiError.*` rather than string literals in route tests, so a code
rename does not need a test rewrite.
