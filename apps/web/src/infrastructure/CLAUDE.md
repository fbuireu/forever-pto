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
| `actions/` | The `'use server'` entry points: `payment.ts` and `contact.ts`. They read request-scoped config and hand it to the matching operation under [`api/operations/`](./api/operations) |
| `api/` | The wire vocabulary for failures, the no-store response helper, and the operations both transports terminate. See [`api/CLAUDE.md`](./api/CLAUDE.md) |
| `clients/` | SDK wrappers: Effect service tags plus modules that are deliberately not services. See [`clients/CLAUDE.md`](./clients/CLAUDE.md) |
| `i18n/` | [`routing.ts`](./i18n/routing.ts) (next-intl routing, `localePrefix: 'as-needed'`), [`config.ts`](./i18n/config.ts) (request config + message loading), [`locales.ts`](./i18n/locales.ts) (the locale codes and `LOCALE_COOKIE`), [`cookie.ts`](./i18n/cookie.ts) (`LOCALE_COOKIE_POLICY`, the one statement of the `NEXT_LOCALE` attributes, plus `setLocaleCookie`), [`utils/url.ts`](./i18n/utils/url.ts) (`localePath`, `resolveLocale`, `getLocaleFromPathname`, `routePathFromPathname`, `localeFromAcceptLanguage`, `localeAlternates`) |

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
next-intl.** It has to be one object because *more than one* writer uses it: the proxy writes the cookie on the
response, and next-intl's `syncLocaleCookie` writes it from `document.cookie` when a language switcher
navigates without a round trip: [`application/i18n/navigation.ts`](../application/i18n/navigation.ts)'s `createNavigation(routing)` passes
`routing.localeCookie` straight into it. They were written separately and disagreed on flags, and
one of them was fatal: `setLocaleCookie` added `httpOnly`, which a browser honours by **discarding** any
later `document.cookie` write to that name on a matching domain and path. So a soft locale switch never
persisted. The es→en direction could not recover either, because `en` is the unprefixed default under
`localePrefix: 'as-needed'`; with no prefix to read, next-intl's `resolveLocale` fell to the stale cookie
and redirected back to `/es`. `httpOnly` is gone; there is nothing secret in a language preference.

`path: '/'` is the half that is still load-bearing. next-intl's middleware defaults it to
`request.nextUrl.basePath || undefined`, which on this app is `undefined`, and a cookie set with no `path`
takes the request's own directory, so a switch made on `/es/planner` would have been scoped to `/es` while
the client-side write scoped itself to `/`. Rival cookies, one name. Naming `path` in the policy is what makes
both writers produce the same one.

**`resolveLocale` is the one place a candidate becomes a locale.** `hasLocale(LOCALES, x) ? x : routing.defaultLocale`
was written out verbatim at several sites (the request config, the activate route's `?locale=` and the
path-segment reader), and a fourth, [`global-not-found.tsx`](../app/global-not-found.tsx), hand-rolled a header→cookie→`Accept-Language`
chain that existed nowhere else and was reachable only through a page most users never see. The
`Accept-Language` half is `localeFromAcceptLanguage` now and answers `undefined` rather than the default, so
the caller decides the fallback and the precedence is assertable without rendering a document.
| `logging/` | [`logger.ts`](./logging/logger.ts), the `logger` object every log line in the app goes through; [`contract.ts`](./logging/contract.ts), its service name, levels and `stripQuery`; [`service.ts`](./logging/service.ts), the `LoggerService` tag wrapping that same object. See *`logging/`* below |
| `markdown/` | `buildMarkdownPage.ts`: the Markdown twin of a page, served when the request asks for `text/markdown`. Translates through `createTranslator` over statically imported bundles, never `next-intl/server`; see *Gotchas*. [`twin.ts`](./markdown/twin.ts) beside it holds how the twin is *requested* and *cached*: the route path, the `Accept` token, the `x-markdown-path` header the proxy sets, and `markdownTwinHeaders({ found })`. Both the proxy and the route read it, which is what stopped the policy being a guess made before the lookup; see [`../app/CLAUDE.md`](../app/CLAUDE.md) |
| `seo/` | [`buildMetadata.ts`](./seo/buildMetadata.ts): the `Metadata` shape every route's `generateMetadata` fills in; [`routeMetadata.ts`](./seo/routeMetadata.ts): that `generateMetadata`, built from a route's own row so a route file is one line; [`routes.ts`](./seo/routes.ts): `SITE_ROUTES`, the one list of pages and whether each is indexable, plus `routeFor`, the total lookup keyed by the table's own literal paths |
| `proxy/` | Middleware helpers: `location.ts` (country detection + cookie) and [`cookie.ts`](./proxy/cookie.ts) (`user-country`, one week) |
| `services/` | Everything with a purpose but no SDK of its own: `contact/`, `countries/`, `env/`, `holidays/`, `location/`, `payments/`, `premium/`, `regions/`. Some carry their own guides: [holidays](./services/holidays/CLAUDE.md), [location](./services/location/CLAUDE.md), [payments](./services/payments/CLAUDE.md) |
| `well-known/` | [`slugs.ts`](./well-known/slugs.ts) (the slugs, the shared cache header, `wellKnownUrl`), [`documents.ts`](./well-known/documents.ts) (slug → content type and builder), and the builders [`apiCatalog.ts`](./well-known/apiCatalog.ts) (RFC 9727 linkset), [`mcpServerCard.ts`](./well-known/mcpServerCard.ts) (SEP-1649) and [`agentSkillsIndex.ts`](./well-known/agentSkillsIndex.ts), each returning a plain object, with the route owning the response envelope |
| `workers/` | The calculations Web Worker and its message contract. See [`workers/CLAUDE.md`](./workers/CLAUDE.md) |
| [`errors.ts`](./errors.ts) | Every tagged error in the app: `DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError` and its `PaymentRequestError` subclass, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError` |
| [`layers.ts`](./layers.ts) | `ApplicationLayer`: the Live layers merged, provided at every entry point |
| [`span.ts`](./span.ts) | `traced({ name, run })`: opens a named span through the runtime's `ctx.tracing` so a trace reads `createPayment` rather than `POST`. Wrapped around every entry point that terminates an Effect program |

**`traced` resolves the tracing API first and calls the work exactly once, which is the whole of why it is
not a `try`/`catch` around the call.** Wrapping `ctx.tracing.enterSpan(name, run)` in a `catch` that falls
back to `run()` reads the same and is a double-charge bug: a rejected payment would land in the `catch` and
be run a second time. So the lookup of `getCloudflareContext().ctx.tracing` is what is guarded, and the
result decides which of the two single calls happens. `span.test.ts` pins the call count on every path,
including the rejecting one, because that is the assertion that can tell the two shapes apart.

The names are the use cases' (`createPayment`, `sendContactEmail`, `activatePremium`,
`processWebhookEvent`, `verifySession`, `paymentConfirmation`), so a trace in the log sink reads as the
operation rather than as `POST`. They sit at the entry point rather than inside the Effect program because
the runtime's span API is callback-scoped and hands out no span id, so Effect's `Tracer` cannot be bridged
onto it; [ADR 0017](../../../../adr/0017-observability-is-the-platform-export.md) has the detail. The
`Effect.withSpan` call each use case still ends in is not what produces these.

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

**`@domain/*` is reached from a handful of files, and one of them is neither in `workers/` nor from `calendar/`.**
[`workers/types.ts`](./workers/types.ts), [`workers/utils/serializers.ts`](./workers/utils/serializers.ts) and
[`workers/worker.ts`](./workers/worker.ts) take the calendar types and `runPlanningPipeline`, which is the
documented case. [`services/payments/repository.ts`](./services/payments/repository.ts) takes
`PaymentStatus` from `@domain/payment/events/types`, as `import type`, because the column it writes is that
union and the alternative is a second declaration of the same strings one layer down. That is the whole
of the exception: a **type** out of the payment context, into the module that persists it. Anything with a
runtime dependency, or anything out of `@domain/calendar/` outside `workers/`, is not covered by it.

**Imports in a couple of files reach `apps/web/src/ui/`, through the `@i18n` shorthand.**
[`i18n/config.ts`](./i18n/config.ts) loads a locale bundle dynamically and
[`markdown/buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts) imports every bundle statically, both as
`@i18n/messages/<locale>.json`. `@i18n/*` resolves to `./src/ui/i18n/*`, so those are `infrastructure -> ui`
edges; the old rule read the literal specifier `@ui/` and the shorthand walked straight past it. They are
tolerated rather than endorsed: the bundles are translation **data**, not UI, no component is pulled in
behind them, and the alternative is moving `src/ui/i18n/messages/` to a fourth top-level tier, which is the
move [ADR 0012](../../../../adr/0012-shared-date-helpers-stay-in-the-application-layer.md) already weighed
and rejected for the date helpers. The rule that matters is the one the sentence was reaching for: **no
component, no style, no asset**. `tests/docs-consistency.test.ts` reads every alias that lands inside
`src/ui/` (`@ui/`, `@i18n/`, `@styles/`, `@assets/`) and fails on any importer here outside those files.

**No React component reaches this layer, and that part is newly true.**
[`clients/tutorial/driver/client.tsx`](./clients/tutorial/driver/client.tsx) used to import the app's animated
icons so the driver.js popover could render the app's own close button; it now takes the element as an
injected `closeIcon` config prop, and [`hooks/useTutorial.tsx`](../ui/hooks/useTutorial.tsx) in the UI layer,
already on the other side of the boundary, builds it and passes it to `start()`. A component import creeping
back into the driver client is the regression to watch for, and it is the one the suite now catches rather
than review.

Biome still has no import-boundary rule, so everything above holds by review except the shapes the
contract suite reads: the `src/ui/` reach listed here, and the layer graph as a whole, which
`tests/docs-consistency.test.ts` compares against the table published in the architecture overview.

## Effect, and where it stops

Every server path that talks to Stripe, Turso or Resend is an Effect program with a typed error channel and
its dependencies injected as service tags
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)). The program is *composed* in
`services/` and `@domain/payment/`, and *terminated* at an entry point (a route handler under `src/app/api/`
or a server action here) with `Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer), …))`.

Things about that termination bite in practice:

**Providing `ApplicationLayer` builds every client, but building one reads no environment.** `Layer.mergeAll`
is not lazy per tag, so every entry point constructs them all. Each client reads its own configuration lazily,
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

## `logging/`

`logger` is a module-level object with `info`, `warn`, `error` and `logError`, each taking one
`{ message, context }` object (`logError` adds `error`), and it sends nothing anywhere. Each call writes **one
`JSON.stringify` line to `console[level]`**, and Cloudflare's own observability exports it to Better Stack over
OTLP, named as a `destinations` entry in [`wrangler.toml`](../../wrangler.toml)
([ADR 0018](../../../../adr/0018-the-platform-is-the-log-transport.md)). It is the same object, the same line
and the same path as contribKit's logger, byte for byte apart from `LOG_SERVICE`, so a reader who knows one
knows the other; what is specific to this app is the `LoggerService` tag, named below.

**A log call cannot fail its caller, and that is the property everything else leans on.** `write` is one
statement:

```ts
console[level](JSON.stringify({ ...redacted(context), service: LOG_SERVICE, level, message }));
```

wrapped in a `try` that returns. What is load-bearing in it:

- **The spread order.** `context` comes first, so a caller passing `{ level: 'info' }` or
  `{ service: 'something-else' }` cannot relabel its own line. Written the other way round it reads
  identically and lets a log lie about which level and which service produced it; `logger.test.ts` asserts
  the level, the message and the service each survive a context that tries to overwrite them, and inverting
  the spread turns three of those cases red.
- **The `try`.** `JSON.stringify` throws on a circular reference and on a `BigInt`. Without it, a caller
  passing either takes down the Zustand action or the payment handler it was logging from.
- **The index.** `console[level]` is indexed by the contract's own union, so a level added to `LOG_LEVEL` that
  `console` has no method for fails to compile here rather than falling through to `console.error`;
  `logger.test.ts` iterates `LOG_LEVEL` and asserts each level reaches the method of its own name and no other.

That second point is why the guarantee has to live here at all: `logger` is called *bare*, outside any Effect
combinator, from Zustand actions, the country lookups and both payment handlers. A throw from one of those
positions inside an `Effect.gen` is a defect that neither `Effect.catchTags` nor the trailing `Effect.catchAll`
can map, the same failure the clients guide describes for layer construction. `Effect.sync` would not help: a
throw inside it is equally a defect. `describe('a log never fails its caller')` in `logger.test.ts` is what
holds it there.

The price is that a lost log is silent, and that the structured fields are serialised here rather than handed
to an API as an object, so the sink parses them back out of the JSON body. That was accepted knowingly; see
[ADR 0018](../../../../adr/0018-the-platform-is-the-log-transport.md).

**The object carries exactly the methods something calls.** It was a class with `debug`, `logDuration`,
`measureAsync`, `withContext` and a base context stamping `environment: NODE_ENV` on every line, and outside
the class itself none of those had a caller; the `environment` field was also `production` on every preview
Worker, which is the one place it would have mattered. `logError` is the one method beyond the three levels,
because sixteen call sites pass an `Error` through it and it is what serialises `message`, `name`, `stack` and
the error's own enumerable fields into the `error` field of the line. contribKit carries the same method and
routes its `logServerError` through it.

**There is no transport to scope to a request any more, and the hazard it existed for is worth keeping in
view.** The client held a `@logtail/edge` batcher: the first call armed a `setTimeout`, later calls joined the
buffer, and the timer's callback ran the `fetch`. As one module-level instance, that batcher armed its timer
inside request A and delivered request B's lines through it, which workerd refuses as
`Cannot perform I/O on behalf of a different request`, cancelling a request left waiting on a promise another
request's context owns. Keying one instance per `ExecutionContext` in a `WeakMap` fixed it, and writing to
`console` removes the class of problem: there is no buffer, no timer and no `fetch`, so nothing can outlive the
request that wrote it. Any future transport that batches has to answer this question again.

**`console` is a lint error everywhere else in this package.** The root [`biome.json`](../../../../biome.json)
turns `noConsole` off for [`logging/logger.ts`](./logging/logger.ts) and for nothing else, which is what keeps
this file the only writer; the entry must not become a package-wide allowance.

### The log contract, and the one function in it that guards a secret

[`logging/contract.ts`](./logging/contract.ts) holds `LOG_SERVICE`, `forever-pto-web` in the `<repo>-<package>`
spelling the sibling repositories use, the levels the app emits and `stripQuery`. It is types and constants
only, which is what it has always been, though the reason changed: it was shaped that way so a tail consumer
Worker could import it without pulling a transport into a bundle that had none, and that Worker is gone
([ADR 0017](../../../../adr/0017-observability-is-the-platform-export.md)). It carried a `toLogLevel` as well,
folding workerd's `log` and `trace` onto `info` on the way out of that Worker; nothing has called it since, and
it went with [ADR 0018](../../../../adr/0018-the-platform-is-the-log-transport.md).

**`stripQuery` is the one to understand before touching anything here.** It encodes "a URL in a log context
must not carry its query string, because Stripe appends `payment_intent_client_secret` to the return URL", a
statement about this app's payment flow. Cloudflare's `redact_query_string = true` in
[`wrangler.toml`](../../wrangler.toml) redacts the **request** URL the platform itself records; it does not
touch a `url` field a caller puts in a structured log context, and that is the leak this guards.
[`api/payment/activate/route.ts`](../app/api/payment/activate/route.ts) reads
`payment_intent_client_secret` off the query, already emits a log line per failure, and `matchesClientSecret`
is the only guard on a GET that mints a Premium session, so `{ url: request.url }` added while debugging
would have shipped the secret to the sink. The rule is enforced at the seam rather than at call sites:
`write` strips a string `url` on every line, whichever method emitted it, so no caller has to remember. A
caller that genuinely wants a query string has to name the field something other than `url`, which is the
point: the redaction is keyed on the field name, not on who wrote it. contribKit carries the same rule with
no secret behind it yet, so a `url` field means the same thing in both sinks.

### `LoggerService` is a tag with one adapter, on purpose

It looks like ceremony and the cost is real: every module that logs carries it in `R`, every test that
reaches one stubs its whole surface, and `LoggerServiceLive` hands back the same `logger` object the import
does. It buys one property, verified rather than assumed: because `activateWithEmail` annotates its return
type as requiring `TursoService` and nothing else, a `yield* LoggerService` creeping into its body fails the
build at that function. A bare import cannot do that, since it is not a requirement and never appears in a
type.

**The guarantee is the tag *and* the explicit annotation together.** A program that leaves `R` inferred gets
nothing: the inferred type widens to include `LoggerService` and the build stays green. That makes
"annotate the return type" load-bearing on any Effect program under `@application/use-cases`, not stylistic.

**The tag is not a substitution seam.** `LoggerServiceLive` is `Layer.sync(LoggerService, () => logger)`, so
the tag and the import hand back the *same object*; substituting the tag in a test does not silence a module
that imports `logger` directly, and several do. Where there is no layer to provide, the import is the
documented exception to "every external call goes through Effect"
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)): the lookups under `services/`,
the location strategies, the Zustand stores and the components.

[ADR 0013](../../../../adr/0013-loggerservice-stays-a-tag.md) records the decision and what it costs, so
the next architecture pass does not re-propose deleting it.

### Traces are the platform's, and no log line carries a trace id from here

There is no tracer in this folder and no OpenTelemetry dependency in the package. Cloudflare instruments
handler invocations, outbound `fetch` and binding calls itself, attributes `console` output to the active span,
and stamps the trace id on every log record it exports. Because `console` is what `logger` writes to
([ADR 0018](../../../../adr/0018-the-platform-is-the-log-transport.md)), the app's own lines are among those
records and the correlation a helper here used to build by hand arrives without the app producing it.

**That only holds for lines the runtime sees, which is the trap this replaced.** Between
[ADR 0017](../../../../adr/0017-observability-is-the-platform-export.md) and 0018 the client still posted
over HTTP from inside the Worker, so the spans were in BetterStack, the logs were in BetterStack, and nothing
joined them. A future transport that leaves the runtime again puts it straight back.

**The *correlation.ts* that used to stamp those ids had to go with the wrapper rather than after it**, and the
reason generalises: `trace.getActiveSpan()` reads `@opentelemetry/api`'s global context manager, and the
deleted `@microlabs/otel-cf-workers` wrapper was the only thing in the tree that ever called
`setGlobalContextManager`. Left behind, it would have returned `undefined` on every call and stamped `{}` on
every log line, with its own test still green because that test installed a context manager by hand. A helper
whose test supplies the very thing production stopped providing is the shape to check for.

**`Effect.withSpan` stays on every use case and is wired to nothing.** Effect's `Tracer.Span` wants a
`traceId`, a `spanId` and a caller-supplied end timestamp on a span built synchronously; the runtime's
`cloudflare:workers` span has none of those and exists only inside a callback, so the bridge cannot be
repointed at it. The calls are free, they name the boundary of each use case, and they are the attachment
point if that changes. `ApplicationLayer` in [`layers.ts`](./layers.ts) no longer merges a `TracerLive`.

## The Cloudflare context is request-scoped

`getCloudflareContext()` is only valid inside a request
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). Entry points may call it;
use-cases may not, and receive configuration as plain values instead: `contact.ts` reads
`env.NEXT_PUBLIC_SITE_URL` and `env.NEXT_PUBLIC_CONTACT_EMAIL` and passes them down as a plain object.

Places inside this layer read it directly, and each has a reason:
[`services/env/getRequestPublicEnv.ts`](./services/env/getRequestPublicEnv.ts) (the per-request config both contact transports pass down),
[`services/payments/rateLimit.ts`](./services/payments/rateLimit.ts) (the `PAYMENT_RATE_LIMITER` binding),
[`services/env/getPublicEnv.ts`](./services/env/getPublicEnv.ts) (evaluated during prerender as well as per request, so it uses the `{ async: true }` form),
and [`services/location/utils/strategies.ts`](./services/location/utils/strategies.ts) (only
`env.NEXT_PUBLIC_SITE_URL`, to build the CDN trace URL). The signal that makes country detection cheap is not
the Cloudflare context at all: it is the `cf-ipcountry` request header, read by `detectCountryFromHeaders`,
which touches no context and is why the common path needs no geolocation service.

**There are rival readers of the same variables, and the difference is *when* they are asked.**
`getPublicEnv` is the build-safe one (the `{ async: true }` context, which falls back to wrangler's platform
proxy during prerender), and [`sitemap.ts`](../app/sitemap.ts), [`robots.ts`](../app/robots.ts) and every route's `generateMetadata` use it because they may be evaluated outside
a request. `getRequestPublicEnv` beside it is the synchronous, per-request one, and the contact
transports use it. They each hand-mapped those lines before, which is the residue of exactly the drift
`operations/` exists to prevent.

They are deliberately not merged. Pointing the transports at `getPublicEnv` would change the context form
on the path that decides where a contact email is sent, and that is the same class of question as the
`NEXT_PUBLIC_SITE_URL` resolution below, verifiable only against a real build. One reader per timing, one
place each.

`getPublicEnv` used to carry `'use cache'` with `cacheLife('days')`; it does not since
[ADR 0015](../../../../adr/0015-cache-components-stay-off-on-the-workers-runtime.md) turned Cache Components off,
and it needs no cache: both values are deploy-time constants, so reading them costs nothing and a caller cannot
observe a stale one. Its return type `PublicEnv` is exported and is the config shape
[`api/operations/contact.ts`](./api/operations/contact.ts) takes, so they cannot drift into describing different objects.

## Separate transports per operation, one implementation

Payment creation and contact submission are each reachable more than one way: a route handler under `src/app/api/` and
a server action here. They no longer restate the operation. Both call the module under
[`api/operations/`](./api/CLAUDE.md), which owns the rate limit, the use-case, the deferred write and the
failure-to-status mapping, and answers a transport-free `{ status, body }`. The action drops the status; the
route puts it on a `NextResponse`.

[`actions/payment.ts`](./actions/payment.ts) cannot forget to rate-limit before creating a payment, because it no longer does either:
that ordering lives in the operation and is asserted once. They used to be kept equal by grep, and had
already drifted over how a missing IP header was recorded.

## Gotchas

- **"Worker" means more than one thing in this repo.** `workers/` is a browser Web Worker. The Cloudflare
  Worker is the deployment target, configured in `wrangler.toml` and built by OpenNext. Nothing in `workers/`
  runs on the server.
- **An option list is collated by `collateByLabel`, and only one of its callers has a locale to give
  it.** `getCountries` localises its labels through `i18n-iso-countries` and then has to collate them in that
  same locale; it used to end in a bare `localeCompare` with no argument, so every non-English visitor got a
  Country list ordered by the runtime default, which on the deployed Worker is not theirs. The services
  each held their own copy of that sort, which is how one of them came to be wrong. `getRegions` passes no
  locale on purpose: its labels come from `date-holidays`' `getStates()` in whatever language that package
  emits, and it is reached from the location store and from `getHolidays`, neither of which carries one.
  Giving it a locale means threading one from both call sites first.
- **`getCountries.ts`, `getRegions.ts`, `getHolidays.ts` and `location/utils/strategies.ts` import `logger`
  statically.** The import needs no configuration and costs nothing at runtime, since the module is a
  `console` writer, but it does pull `logging/logger.ts` and its contract into whatever bundle imports them,
  and [`Countries.tsx`](../ui/modules/sidebar/components/Countries.tsx) imports `getCountries.ts` from the UI
  layer. The stores and components reach the same object through `logClient`'s dynamic import instead; see
  [`../ui/CLAUDE.md`](../ui/CLAUDE.md).
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
  declaration. The numbers are kept rather than dropped precisely because a declaration is the only thing
  a test can tie back to the asset: [`seo/buildMetadata.test.ts`](./seo/buildMetadata.test.ts) reads the PNG's
  IHDR (two big-endian `uint32`s at byte 16) from whatever `OG_IMAGE` names, resolved against `public/`, and
  asserts both the declared dimensions and the card that width can carry. Drop a real social card in and the
  card assertion goes red rather than leaving `summary` behind on a 1200-pixel image.
- **`verifySession` fails in more than one way under one tag, and the vocabulary lives in
  [`services/premium/sessionErrors.ts`](./services/premium/sessionErrors.ts) rather than in `session.ts`.**
  "Did not verify", meaning expired, malformed or signed by something else, is a `SessionError`, and the
  check-session `GET` clears the cookie and stays quiet. "Could not verify", meaning `JWT_SECRET` is absent, is a
  `SessionConfigurationError`, a subclass adding no members, so the `_tag`, `TaggedFailure` and
  `describeFailure` are all unchanged and only `isSessionConfigurationError` sees the difference. That branch
  keeps the cookie and logs at error. It is the
  [`serverService.ts`](./clients/payments/stripe/serverService.ts) `WebhookConfigurationError` shape, copied
  deliberately. `session.ts` keeps only the Effects and hands `wrapSessionError` to both `catch`
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
  `buildMarkdownPage.ts` uses `createTranslator` from `next-intl` over the statically imported bundles
  instead (no cache, no request scope, same compile-time checking of message keys), and its test asserts the
  module never imports `next-intl/server` again. Nothing reproduces this locally: Node has no such rule, and
  20 consecutive requests to `next start` all succeed.

## Testing

Every module with behaviour has a co-located `.test.ts`. A few files have none, and each falls into one of the same
categories: types only ([`workers/types.ts`](./workers/types.ts), [`services/holidays/source/types.ts`](./services/holidays/source/types.ts)); or itself a test double
([`services/holidays/source/fixture.ts`](./services/holidays/source/fixture.ts), the second adapter at the `HolidaySource` seam, exercised by every
test that uses it).

**[`api/errors.ts`](./api/errors.ts) was listed here as a third kind (a const map asserted through the route tests), and it is
not.** It has [`api/errors.test.ts`](./api/errors.test.ts) beside it, which is the only place the tag→status table belongs; the route
and action tests that restated it row by row have been cut back to what each transport alone decides. See
[`api/CLAUDE.md`](./api/CLAUDE.md).

**`seo/buildMetadata.ts` and [`services/holidays/source/dateHolidays.ts`](./services/holidays/source/dateHolidays.ts) were a fourth kind (untested) and
are not any more.** `buildMetadata` was reached only through the route `metadata.test.ts` files that existed then, and
every twitter/images assertion in them was positive and lived in the indexable routes, so both
`indexable &&` guards could be deleted and the suite stayed green while a noindex legal page began
advertising an Open Graph image and a Twitter card. `dateHolidays` is the adapter that decides
the two-year Planning Window and whether a Region-scoped lookup is constructed at all; its co-located test
asserts the *call pattern* (which years are asked for, how many `Holidays` are built, that `getStates` is
given the lower-cased Country) rather than the shape `date-holidays` returns, which is the only kind of
claim a mock of that package can honestly make.

Tests substitute a service tag with
`Layer.succeed(Tag, { … })`; no test constructs a real Stripe, Turso or Resend client.

[`layers.test.ts`](./layers.test.ts) is the shape to copy when a test has to import something that transitively pulls in
`layers.ts`: it mocks every Live layer with `Layer.empty`, because constructing the real ones would demand
the environment variables. Assert against `ApiError.*` rather than string literals in route tests, so a code
rename does not need a test rewrite.
