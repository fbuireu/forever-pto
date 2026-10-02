# apps/web/src/infrastructure

## Purpose

The only layer that reaches outward. Everything that talks to a network, a database, a cookie jar, the
Cloudflare runtime or another thread lives here: SDK wrappers, server actions, proxy helpers, locale
routing, the `.well-known` endpoints and the calculations Web Worker. It holds no planning rule and no
orchestration: a use-case decides *what* happens, this layer knows *how* to reach the thing it happens to.

Because the planner runs in the browser ([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)), the
server side of this layer is small: payments, one contact form, a Stripe webhook and some static rendering.
The heaviest work in here runs in the browser: the Web Worker.

## Subdirectories

| Directory | Contents |
| --- | --- |
| `actions/` | The `'use server'` entry points: `payment.ts` and `contact.ts`. They read request-scoped config and hand it to the matching operation under [`api/operations/`](./api/operations) |
| `api/` | The wire vocabulary for failures, the no-store response helper, and the operations both transports terminate. See [`api/AGENTS.md`](./api/AGENTS.md) |
| `clients/` | SDK wrappers: Effect service tags plus modules that are deliberately not services. See [`clients/AGENTS.md`](./clients/AGENTS.md) |
| `i18n/` | [`routing.ts`](./i18n/routing.ts) (next-intl routing, `localePrefix: 'as-needed'`), [`config.ts`](./i18n/config.ts) (request config + message loading), [`locales.ts`](./i18n/locales.ts) (the locale codes, `isLocale` and `LOCALE_COOKIE`), [`cookie.ts`](./i18n/cookie.ts) (`LOCALE_COOKIE_POLICY`, the one statement of the `NEXT_LOCALE` attributes, plus `setLocaleCookie`), [`clientMessages.ts`](./i18n/clientMessages.ts) (`clientMessagesOf`, the catalogue the browser is sent, minus `SERVER_ONLY_NAMESPACES`), [`utils/url.ts`](./i18n/utils/url.ts) (`localePath`, `resolveLocale`, `getLocaleFromPathname`, `routePathFromPathname`, `localeFromAcceptLanguage`, `localeAlternates`) |
| `logging/` | [`logger.ts`](./logging/logger.ts), the `logger` object every log line in the app goes through; [`contract.ts`](./logging/contract.ts), its service name, levels and `stripQuery`; [`service.ts`](./logging/service.ts), the `LoggerService` tag wrapping that same object. See *`logging/`* below |
| `markdown/` | `buildMarkdownPage.ts`: the Markdown twin of a page, served when the request asks for `text/markdown`. Translates through `createTranslator` over statically imported bundles, never `next-intl/server`; see *Gotchas*. [`twin.ts`](./markdown/twin.ts) beside it holds how the twin is *requested* and *cached*: the route path, the `Accept` token, the `x-markdown-path` header the proxy sets, and `markdownTwinHeaders({ found })`. Both the proxy and the route read it, so the cache policy is chosen after the lookup; see [`../app/AGENTS.md`](../app/AGENTS.md) |
| `seo/` | [`buildMetadata.ts`](./seo/buildMetadata.ts): the `Metadata` shape every route's `generateMetadata` fills in; [`routeMetadata.ts`](./seo/routeMetadata.ts): that `generateMetadata`, built from a route's own row so a route file is one line; [`routes.ts`](./seo/routes.ts): `SITE_ROUTES`, the one list of pages and whether each is indexable, plus `routeFor`, the total lookup keyed by the table's own literal paths |
| `proxy/` | Middleware helpers: `location.ts` (country detection + cookie) and [`cookie.ts`](./proxy/cookie.ts) (`user-country`, one week) |
| `services/` | Everything with a purpose but no SDK of its own: `contact/`, `countries/`, `env/`, `holidays/`, `location/`, `payments/`, `premium/`, `regions/`. Some carry their own guides: [holidays](./services/holidays/AGENTS.md), [location](./services/location/AGENTS.md), [payments](./services/payments/AGENTS.md) |
| `well-known/` | [`slugs.ts`](./well-known/slugs.ts) (the slugs, the shared cache header, `wellKnownUrl`), [`documents.ts`](./well-known/documents.ts) (slug → content type and builder), and the builders [`apiCatalog.ts`](./well-known/apiCatalog.ts) (RFC 9727 linkset), [`mcpServerCard.ts`](./well-known/mcpServerCard.ts) (SEP-1649) and [`agentSkillsIndex.ts`](./well-known/agentSkillsIndex.ts), each returning a plain object, with the route owning the response envelope |
| `workers/` | The calculations Web Worker and its message contract. See [`workers/AGENTS.md`](./workers/AGENTS.md) |
| [`errors.ts`](./errors.ts) | Every tagged error in the app: `DatabaseError`, `DuplicateContactError`, `EmailError`, `MissingDonorEmailError`, `PaymentError` and its `PaymentRequestError` subclass, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError`. The codes a `PromoCodeError` carries, `PromoCodeErrors`, live in [`application/dto/payment/types.ts`](../application/dto/payment/types.ts), a module without Effect, so the schema that checks them sits beside the other payment schemas without bringing Effect into their importers. The two other subclasses sit beside what raises them: `SessionConfigurationError` in [`services/premium/sessionErrors.ts`](./services/premium/sessionErrors.ts), `WebhookConfigurationError` in [`clients/payments/stripe/serverService.ts`](./clients/payments/stripe/serverService.ts) |
| [`layers.ts`](./layers.ts) | `ApplicationLayer`: the Live layers merged, provided at every entry point |
| [`span.ts`](./span.ts) | `traced({ name, run })`: opens a named span through the runtime's `ctx.tracing` so a trace reads `createPayment` rather than `POST`. Wrapped around every entry point that terminates an Effect program |

**`traced` resolves the tracing API first and calls the work exactly once, which is the whole of why it is
not a `try`/`catch` around the call.** Wrapping `ctx.tracing.enterSpan(name, run)` in a `catch` that falls
back to `run()` reads the same and is a double-charge bug: a rejected payment would land in the `catch` and
be run a second time. So the lookup of `getCloudflareContext().ctx.tracing` is what is guarded, and the
result decides which of the two single calls happens. `span.test.ts` pins the call count on every path,
including the rejecting one.

The names are the use cases' (`createPayment`, `sendContactEmail`, `activatePremium`,
`processWebhookEvent`, `verifySession`, `paymentConfirmation`), so a trace in the log sink reads as the
operation rather than as `POST`. They sit at the entry point rather than inside the Effect program because
the runtime's span API is callback-scoped and hands out no span id, so Effect's `Tracer` cannot be bridged
onto it; [ADR 0017](../../../../adr/0017-observability-is-the-platform-export.md) has the detail. The
`Effect.withSpan` each use case ends in is not what produces these.

There is no `services/calendar/`. The planning engine is `@domain/calendar/`, and `FilterStrategy` is declared
there, not here.

## Locales

- **`LOCALES` is `as const`**, so `Locale` is the union of the codes rather than `string`.
  [`markdown/buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts) keys `MESSAGES` by `LocaleCode`, so a new
  locale fails to compile until it has a bundle row there.
- **`isLocale` sits beside the codes rather than being derived from `resolveLocale`**, because the Web Worker
  needs it and `resolveLocale` pulls `routing`. The worker narrows the incoming `locale` with it exactly as it
  narrows `strategy` with `isFilterStrategy`; the wire value is genuinely unvalidated there.
- **`NEXT_LOCALE`'s attributes are stated once, in `cookie.ts`, and `routing.ts` hands that same object to
  next-intl.** More than one writer uses it: the proxy writes the cookie on the response through
  `setLocaleCookie`, and next-intl's `syncLocaleCookie` writes it from `document.cookie` when a language switcher
  navigates without a round trip ([`application/i18n/navigation.ts`](../application/i18n/navigation.ts)'s
  `createNavigation(routing)` passes `routing.localeCookie` straight into it). It is not `httpOnly`: a browser
  **discards** a later `document.cookie` write to an `httpOnly` name on a matching domain and path, so a soft
  locale switch would never persist. There is nothing secret in a language preference.
- **`path: '/'` is load-bearing.** next-intl's middleware defaults it to `request.nextUrl.basePath || undefined`,
  which on this app is `undefined`, and a cookie set with no `path` takes the request's own directory, so a
  switch made on `/es/planner` would be scoped to `/es` while the client-side write scopes itself to `/`. Rival
  cookies, one name.
- **`resolveLocale` is the one place a candidate becomes a locale.** `localeFromAcceptLanguage` answers
  `undefined` rather than the default, so the caller decides the fallback and the precedence is assertable
  without rendering a document; [`global-not-found.tsx`](../app/global-not-found.tsx) chains the two.

## Layer rules

May import from `@application/*` (DTOs and their schemas, use-cases, and the shared `collate` and `dateIntake`
helpers) and from `@domain/*`, which is narrower in practice than it reads and is enumerated below. Must not
import a React component, a style or an asset out of `@ui/*`.

**`@domain/*` is reached from the Web Worker and from two payment modules.** [`workers/types.ts`](./workers/types.ts),
[`workers/utils/serializers.ts`](./workers/utils/serializers.ts) and [`workers/worker.ts`](./workers/worker.ts)
take the calendar types, `runPlanningPipeline` and the boundary predicates the worker narrows with
(`isFilterStrategy`, `isPreferredMonths`). The payment context reaches two modules under `services/payments/`:
[`repository.ts`](./services/payments/repository.ts) takes `ReportedPaymentStatus`, as `import type`, because
the column it writes is that union and the alternative is a second declaration of the same strings one layer
down; [`confirmation.ts`](./services/payments/confirmation.ts) takes `PAYMENT_SUCCEEDED`, the one value it
compares a retrieved intent with. Nothing else here imports from `@domain/*`.

**Imports in a couple of files reach `apps/web/src/ui/`, through the `@i18n` shorthand.**
[`i18n/config.ts`](./i18n/config.ts) loads a locale bundle dynamically and
[`markdown/buildMarkdownPage.ts`](./markdown/buildMarkdownPage.ts) imports every bundle statically, both as
`@i18n/messages/<locale>.json`. `@i18n/*` resolves to `./src/ui/i18n/*`, so those are `infrastructure -> ui`
edges. They are tolerated rather than endorsed: the bundles are translation **data**, not UI, no component is
pulled in behind them, and the alternative is moving `src/ui/i18n/messages/` to a fourth top-level tier, which
is the move [ADR 0012](../../../../adr/0012-shared-date-helpers-stay-in-the-application-layer.md) already
weighed and rejected for the date helpers. The rule that matters is **no component, no style, no asset**.
`tests/docs-consistency.test.ts` reads every alias that lands inside `src/ui/` (`@ui/`, `@i18n/`, `@styles/`,
`@assets/`) and fails on any importer here outside those files.

**No React component reaches this layer.** [`clients/tutorial/driver/client.tsx`](./clients/tutorial/driver/client.tsx)
takes the popover's close icon as the injected `closeIcon` config field, and
[`hooks/useTutorial.tsx`](../ui/hooks/useTutorial.tsx) in the UI layer builds it and passes it to `start()`. A
component import in the driver client is the regression to watch for, and the suite catches it.

Biome has no import-boundary rule. The contract suite reads the `src/ui/` reach listed here and the layer graph
as a whole, which `tests/docs-consistency.test.ts` compares against the table published in the architecture
overview; the rest holds by review.

## Effect, and where it stops

Every server path that talks to Stripe, Turso or Resend is an Effect program with a typed error channel and
its dependencies injected as service tags
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)). The program is *composed* in
`services/` and `@domain/payment/`, and *terminated* where a request is handled (an operation under
`api/operations/`, or a route handler or page under `src/app/`) with
`Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer), …))`.

Things about that termination bite in practice:

**Providing `ApplicationLayer` builds every client, but building one reads no environment.** `Layer.mergeAll`
is not lazy per tag, so every entry point constructs them all. Each client reads its own configuration lazily,
inside the call, and reports a missing variable as its own tagged error (`DatabaseError`, `EmailError`,
`PaymentError`), which the entry point maps like any other failure. A read at construction would be an Effect
*defect* instead, which no `catchAll` sees: a missing `RESEND_API_KEY` would break the payment route, which
sends no mail, as a rejected promise rather than a status.

**Work deferred with `after()` has to re-provide the layer.** The operations under `api/operations/` split a
use-case's result into the answer and a `deferred` Effect, hand the deferred half to `after()` and run it
separately with `Effect.provide(ApplicationLayer)`. The outer program has already been run by then; the
deferred one carries its requirements with it and would not compile otherwise.

**Logging is the documented exception.** The logger has a tag *and* a plain `logger` export, and the export is
what [`getCountries.ts`](./services/countries/getCountries.ts), [`getRegions.ts`](./services/regions/getRegions.ts),
[`getHolidays.ts`](./services/holidays/getHolidays.ts), the country-detection strategies and, through
`logClient`, the Zustand stores use, anywhere there is no layer to provide. "All external calls go through
Effect" is false for logging, on purpose ([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)).

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
console[level](JSON.stringify({ ...serializable(redacted(context)), service: LOG_SERVICE, level, message }));
```

and every method runs it inside a `try` that returns. What is load-bearing in it:

- **The spread order.** `context` comes first, so a caller passing `{ level: 'info' }` or
  `{ service: 'something-else' }` cannot relabel its own line. Written the other way round it reads
  identically and lets a log lie about which level and which service produced it; `logger.test.ts` asserts
  the level, the message and the service each survive a context that tries to overwrite them, and inverting
  the spread turns three of those cases red.
- **The `try` and `serializable`.** `JSON.stringify` throws on a circular reference and on a `BigInt`, so
  `serializable` tries each context value on its own and writes one it cannot hold as `"[unserializable]"`: the
  line still reaches the sink, with every other field. The `try` around the whole call, `logError`'s description
  of the error included, catches whatever is left (a console that throws), so nothing a caller passes takes
  down the Zustand action or the payment handler it was logging from.
- **The index.** `console[level]` is indexed by the contract's own union, so a level added to `LOG_LEVEL` that
  `console` has no method for fails to compile here rather than falling through to `console.error`;
  `logger.test.ts` iterates `LOG_LEVEL` and asserts each level reaches the method of its own name and no other.

That second point is why the guarantee has to live here at all: `logger` is called *bare*, outside any Effect
combinator, from Zustand actions, the country lookups and both payment handlers. A throw from one of those
positions inside an `Effect.gen` is a defect that no `catchAll` can map, the same failure a read at layer
construction would raise. `describe('a log never fails its caller')` in `logger.test.ts` is what holds it
there.

The price is that a lost log is silent, and that the structured fields are serialised here rather than handed
to an API as an object, so the sink parses them back out of the JSON body; see
[ADR 0018](../../../../adr/0018-the-platform-is-the-log-transport.md).

**The object carries exactly the methods something calls.** `logError` is the one method beyond the three
levels: every call site with an `Error` to report passes it through it, and it is what serialises `message`,
`name`, `stack` and the error's own enumerable fields into the `error` field of the line. contribKit carries the
same method and routes its `logServerError` through it.

**workerd refuses I/O on behalf of another request** (`Cannot perform I/O on behalf of a different request`), so
a module-level buffer whose timer one request armed cannot deliver another request's lines. Writing to `console`
leaves no buffer, no timer and no `fetch` to outlive the request that wrote it.

**`console` is a lint error everywhere else in this package.** The root [`biome.json`](../../../../biome.json)
turns `noConsole` off for [`logging/logger.ts`](./logging/logger.ts) and for nothing else, which is what keeps
this file the only writer; the entry must not become a package-wide allowance.

**The production build keeps the logger's levels and strips every other `console` call.**
[`next.config.ts`](../../next.config.ts) sets `compiler.removeConsole` to `{ exclude: Object.values(LOG_LEVEL) }`
when `NODE_ENV` is `production`, so the compiler deletes a `console.log` or `console.debug` from the app's code
(Next's own route templates included, `node_modules` not) while `info`, `warn` and `error` reach the platform
however they are written, and a level `LOG_LEVEL` gains is kept with no second edit. The contract suite loads the
production config and holds its list equal to `LOG_LEVEL`.

### The log contract, and the one function in it that guards a secret

[`logging/contract.ts`](./logging/contract.ts) holds `LOG_SERVICE`, `forever-pto-web` in the `<repo>-<package>`
spelling the sibling repositories use, `LOG_LEVEL`, the levels the app emits, and `stripQuery`.

**`stripQuery` is the one to understand before touching anything here.** It encodes "a URL in a log context
must not carry its query string, because Stripe appends `payment_intent_client_secret` to the return URL", a
statement about this app's payment flow. Cloudflare's `redact_query_string = true` in
[`wrangler.toml`](../../wrangler.toml) redacts the **request** URL the platform itself records; it does not
touch a `url` field a caller puts in a structured log context, and that is the leak this guards.
[`api/payment/activate/route.ts`](../app/api/payment/activate/route.ts) reads
`payment_intent_client_secret` off the query, emits a log line per failure, and `matchesClientSecret`
is the only guard on a GET that mints a Premium session, so `{ url: request.url }` added while debugging
would ship the secret to the sink. The rule is enforced at the seam rather than at call sites:
`write` strips a string `url` on every line, whichever method emitted it, so no caller has to remember. A
caller that genuinely wants a query string has to name the field something other than `url`, which is the
point: the redaction is keyed on the field name, not on who wrote it. contribKit carries the same rule with
no secret behind it yet, so a `url` field means the same thing in both sinks.

### `LoggerService` is a tag with one adapter, on purpose

It looks like ceremony and the cost is real: every module that logs through it carries it in `R`, every test
that reaches one stubs its whole surface, and `LoggerServiceLive` hands back the same `logger` object the import
does. It buys one property, verified rather than assumed: because `activateWithEmail` annotates its return
type as requiring `TursoService` and nothing else, a `yield* LoggerService` creeping into its body fails the
build at that function. A bare import cannot do that, since it is not a requirement and never appears in a
type.

**The guarantee is the tag *and* the explicit annotation together.** A program that leaves `R` inferred gets
nothing: the inferred type widens to include `LoggerService` and the build stays green.

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
records. That holds only for lines the runtime sees: a transport that posts from inside the Worker leaves the
spans and the logs unjoined.

**`Effect.withSpan` is wired to nothing.** Effect's `Tracer.Span` wants a `traceId`, a `spanId` and a
caller-supplied end timestamp on a span built synchronously; the runtime's `cloudflare:workers` span has none of
those and exists only inside a callback, so no bridge can reach it. [`layers.ts`](./layers.ts) merges no tracer.

## The Cloudflare context is request-scoped

`getCloudflareContext()` is only valid inside a request
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)), so entry points read it and hand
use-cases plain values: [`actions/contact.ts`](./actions/contact.ts) reads `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_CONTACT_EMAIL` through `getRequestPublicEnv` and passes them down as a plain object.

Places inside this layer read it directly, and each has a reason:
[`services/env/getRequestPublicEnv.ts`](./services/env/getRequestPublicEnv.ts) (the per-request config both contact transports pass down),
[`services/payments/rateLimit.ts`](./services/payments/rateLimit.ts) (the `PAYMENT_RATE_LIMITER` binding),
[`services/env/getPublicEnv.ts`](./services/env/getPublicEnv.ts) (evaluated during prerender as well as per request, so it uses the `{ async: true }` form),
[`services/location/utils/strategies.ts`](./services/location/utils/strategies.ts) (only
`env.NEXT_PUBLIC_SITE_URL`, to build the CDN trace URL), and [`span.ts`](./span.ts) (`ctx.tracing`, inside a
`try`, since a caller may run where there is no context). The signal that makes country detection cheap is not
the Cloudflare context at all: it is the `cf-ipcountry` request header, read by `detectCountryFromHeaders`,
which touches no context and is why the common path needs no geolocation service.

**There are rival readers of the same variables, and the difference is *when* they are asked.**
`getPublicEnv` is the build-safe one (the `{ async: true }` context, which falls back to wrangler's platform
proxy during prerender), and [`sitemap.ts`](../app/sitemap.ts), [`robots.ts`](../app/robots.ts) and every route's `generateMetadata` use it because they may be evaluated outside
a request. `getRequestPublicEnv` beside it is the synchronous, per-request one, and the contact
transports use it.

Pointing the transports at `getPublicEnv` would change the context form on the path that decides where a contact
email is sent, the same class of question as the `NEXT_PUBLIC_SITE_URL` resolution in the package guide, verifiable
only against a real build.

`getPublicEnv` carries no cache: both values are deploy-time constants, so reading them costs nothing and a
caller cannot observe a stale one, and `'use cache'` stays out
([ADR 0015](../../../../adr/0015-cache-components-stay-off-on-the-workers-runtime.md)). Its return type
`PublicEnv` is exported and is the config shape [`api/operations/contact.ts`](./api/operations/contact.ts)
takes, so they cannot drift into describing different objects.

## Separate transports per operation, one implementation

Payment creation and contact submission are each reachable more than one way: a route handler under
`src/app/api/` and a server action here. Both call the module under [`api/operations/`](./api/AGENTS.md), which
owns the rate limit where there is one, the use-case, the deferred write and the failure-to-status mapping,
and answers a transport-free `{ status, body }`. The action drops the status; the route puts it on a
`NextResponse`. [`actions/payment.ts`](./actions/payment.ts) cannot forget to rate-limit before creating a
payment, because it does neither itself: that ordering lives in the operation and is asserted once.

## Gotchas

- **"Worker" means more than one thing in this repo.** `workers/` is a browser Web Worker. The Cloudflare
  Worker is the deployment target, configured in `wrangler.toml` and built by OpenNext. Nothing in `workers/`
  runs on the server.
- **An option list is collated by `collateByLabel`, and only one of its callers has a locale to give
  it.** `getCountries` localises its labels through `i18n-iso-countries` and collates them in that same
  locale; a bare `localeCompare` would order the list by the runtime default, which on the deployed Worker is
  not the visitor's. `getRegions` passes no locale on purpose: its labels come from `date-holidays`'
  `getStates()` in whatever language that package emits, and the location store, one of its two callers,
  carries none. Giving it a locale means threading one from the store first.
- **`getCountries.ts`, `getRegions.ts`, `getHolidays.ts` and `location/utils/strategies.ts` import `logger`
  statically.** The import needs no configuration and costs nothing at runtime, since the module is a
  `console` writer, but it does pull `logging/logger.ts` and its contract into whatever bundle imports them,
  and [`Countries.tsx`](../ui/modules/sidebar/components/Countries.tsx) imports `getCountries.ts` from the UI
  layer. The stores and components reach the same object through `logClient`'s dynamic import instead; see
  [`../ui/AGENTS.md`](../ui/AGENTS.md).
- **Country detection sits in front of every HTML response.** [`proxy/location.ts`](./proxy/location.ts) re-sets an existing
  `user-country` cookie instead of re-running [`detectCountry.ts`](./services/location/detectCountry.ts), which is a subrequest with its own timeout.
  Writing back a value it already has is not redundant: it slides the week-long expiry forward on every
  visit, so the chain stays off the hot path for as long as the visitor keeps coming back. Do not
  "simplify" that branch away.
- **The Open Graph block declares the logo's real size, 256x256, and the Twitter card is `summary` because
  of it.** There is no 1200x630 asset in the tree, and `summary_large_image` needs at least 300 pixels of
  width. [`seo/buildMetadata.test.ts`](./seo/buildMetadata.test.ts) reads the PNG's IHDR (two big-endian
  `uint32`s at byte 16) from whatever `OG_IMAGE` names, resolved against `public/`, and asserts both the
  declared dimensions and the card that width can carry: drop a real social card in and the card assertion
  goes red rather than leaving `summary` behind on a 1200-pixel image.
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
  separable from a forged token and stays in the silent branch; [`../app/AGENTS.md`](../app/AGENTS.md)
  records why that is the end of it.
- **`PREMIUM_SESSION_LIFETIME_SECONDS` in `cookie.ts` is the single source of truth for how long Premium
  lasts.** [`session.ts`](./services/premium/session.ts) derives the JWT expiry from it, so a cookie can never outlive the token it carries.
  It lives beside the cookie rather than beside the token because the cookie's `maxAge` is what fixes the
  unit (seconds) for both. Do not reintroduce a second constant.
- **Turso opens a connection per call**, so two calls are two connections and nothing spans them
  transactionally; see [`clients/AGENTS.md`](./clients/AGENTS.md).
- **`next-intl/server` breaks a route handler on workerd.** `getTranslations` memoises its message
  loading, and on Cloudflare that cache outlives the request that filled it; the second request onward throws
  `Cannot perform I/O on behalf of a different request`, which is workerd refusing to let one request touch an
  I/O object another created, so a handler that does it answers 200 once per deploy and 500 after.
  `buildMarkdownPage.ts` uses `createTranslator` from `next-intl` over the statically imported bundles
  instead (no cache, no request scope, same compile-time checking of message keys), and its test asserts the
  module never imports `next-intl/server`. Nothing reproduces this locally: Node has no such rule.

## Testing

Every module with behaviour has a co-located `.test.ts`, with these exceptions: types and constants only
([`workers/types.ts`](./workers/types.ts), [`services/holidays/source/types.ts`](./services/holidays/source/types.ts));
a test double ([`services/holidays/source/fixture.ts`](./services/holidays/source/fixture.ts), the second adapter
at the `HolidaySource` seam, exercised by every test that uses it); and modules exercised only through a
neighbour's test: [`logging/contract.ts`](./logging/contract.ts) through `logger.test.ts`,
[`services/holidays/source/observedHolidays.ts`](./services/holidays/source/observedHolidays.ts) and
[`services/holidays/source/cachedObservedHolidays.ts`](./services/holidays/source/cachedObservedHolidays.ts)
through `getHolidays.test.ts`, [`well-known/documents.ts`](./well-known/documents.ts) and
[`well-known/slugs.ts`](./well-known/slugs.ts) through `agentSkillsIndex.test.ts`, and
[`services/env/getRequestPublicEnv.ts`](./services/env/getRequestPublicEnv.ts) through `actions/contact.test.ts`.

[`api/errors.test.ts`](./api/errors.test.ts) asserts the tag→status table row by row; the operation tests assert
the outcome each operation builds around it, and the route and action tests what each transport alone decides.
See [`api/AGENTS.md`](./api/AGENTS.md).

[`layers.test.ts`](./layers.test.ts) imports `layers.ts` with every Live layer mocked to `Layer.empty`, because
constructing the real ones would demand the environment variables.
