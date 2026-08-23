# src/app

## Purpose

The Next.js App Router tree: every URL the app answers, plus the file-convention entry points Next.js
discovers by name ([`sitemap.ts`](./sitemap.ts), [`robots.ts`](./robots.ts), [`global-error.tsx`](./global-error.tsx), [`global-not-found.tsx`](./global-not-found.tsx), `favicon.ico`).

This folder is a thin shell. Pages compose components from `@ui/*`; route handlers parse the request,
run an Effect program from `@application/use-cases/*` against `ApplicationLayer`, and map the typed
failure channel onto a status code. Business logic that lands here is in the wrong layer.

## The tree

| Path | Role |
| --- | --- |
| `[locale]/layout.tsx` | **The root layout.** There is no layout file at the `src/app` root — this is the only file that renders `<html>`/`<body>` on the normal path |
| `[locale]/(app)/planner/` | The planner screen: sidebar chrome in `layout.tsx`, content in `page.tsx` |
| `[locale]/(app)/payment/confirmation/` | Post-Stripe landing page; reads `payment_intent` from the query string |
| `[locale]/(marketing)/` | Homepage (`page.tsx`) and its header/footer shell (`layout.tsx`) |
| `[locale]/(marketing)/legal/` | Privacy policy, cookie policy, terms of service, legal notice |
| `api/` | Seven route handlers — see below |
| `.well-known/[...slug]/` | Catch-all serving three static JSON documents |
| [`fonts.ts`](./fonts.ts) | The four `next/font/google` families, exported as CSS-variable handles |
| `sitemap.ts`, `robots.ts` | SEO file conventions |
| `global-error.tsx`, `global-not-found.tsx` | Last-resort boundaries that render their own document |

## How a request reaches a page

[`src/middleware.ts`](../middleware.ts) runs first, and its `config.matcher` decides what it sees: everything except `/api`,
`/_next`, `/_vercel` and any path containing a dot, plus `/api/markdown` explicitly. In order it:

1. Serves `/api/markdown` (only to attach `Cache-Control` and `Vary: Accept`).
2. Rewrites any request carrying `Accept: text/markdown` to `/api/markdown?path=<pathname>`, so every HTML
   URL has a Markdown twin without a second route existing. **That promise is only as good as
   `buildMarkdownPage`'s route table** — it matched `/planner` on a substring and handed every other path the
   homepage body, so the four legal pages and the confirmation page each answered with the marketing copy
   under the homepage's title. Routes are now listed explicitly with the `metadata.*` entry they take their
   title and description from; a new route added to the middleware's reach needs a row there, or it inherits
   the homepage again.
3. Redirects `**/payment/confirmation` to the locale home when `payment_intent` is absent.
4. Runs the `next-intl` middleware, which negotiates the locale and fills the `[locale]` segment.
5. Re-writes the `NEXT_LOCALE` cookie next-intl just set, through `setLocaleCookie`
   ([`src/infrastructure/i18n/cookie.ts`](../infrastructure/i18n/cookie.ts)), which adds `httpOnly`, `secure`, `sameSite: 'lax'` and `path: '/'`.
   It looks redundant and is not — next-intl's own cookie carries none of those. [`middleware.test.ts`](../middleware.test.ts) guards
   it under `describe('locale cookie hardening')`.
6. Hands the response to the location proxy ([`src/infrastructure/proxy/location.ts`](../infrastructure/proxy/location.ts)), which sets the
   detected-country cookie.

Security headers are **not** set here. They are the `SECURITY_HEADERS` array in [`next.config.ts`](../../next.config.ts), applied
through `async headers()` on `source: '/(.*)'` — which, unlike this matcher, really does cover every request.

Both Markdown branches set `Vary: Accept` next to `Cache-Control`. The body served under an HTML URL
depends on the `Accept` header, so a shared cache keyed on the URL alone would hand the Markdown twin to
the next visitor asking for HTML.

`localePrefix` is `as-needed` with `en` as the default ([`src/infrastructure/i18n/routing.ts`](../infrastructure/i18n/routing.ts)), so English
URLs carry **no** `/en` prefix while the other five do. Anything building a URL must go through
`localePath` / `localeAlternates` in [`src/infrastructure/i18n/utils/url.ts`](../infrastructure/i18n/utils/url.ts) rather than concatenating the
locale itself.

`[locale]/layout.tsx` re-validates the segment with `hasLocale` and calls `notFound()` — the middleware is
not treated as the only gate, because a statically rendered path can arrive without it.

Every page and layout under `[locale]/` that reads translations **from the request locale** calls
`setRequestLocale(locale)` first. Skipping it there opts the segment out of static rendering; it is not
decoration. Five of the eleven files do not call it, and each has a reason rather than an oversight: the four
`legal/` pages pass the locale explicitly — `getTranslations({ locale, namespace })` — so they never read the
request-locale store and still prerender under the `generateStaticParams` declared in `[locale]/layout.tsx`;
`payment/confirmation/page.tsx` is the one deliberately dynamic page in the tree, so there is no static
render for it to opt out of. Copy the explicit-locale form or the `setRequestLocale` form, not neither.

## The two route groups

Groups do not affect the URL — `(app)` and `(marketing)` exist purely to give two different chromes.

**`(marketing)`** has a group-level `layout.tsx` (header, footer, toaster) and its own `error.tsx`. Its
pages are fully static: `page.tsx` declares `generateStaticParams`, and `metadata.ts` marks the homepage
indexable while every `legal/` page sets `robots: { index: false }`.

**`(app)`** has *no* group-level layout. The sidebar shell lives one level down in `planner/layout.tsx`,
so `payment/confirmation/` deliberately renders bare — a Stripe return should not come back into the
planner chrome. The confirmation route is the one dynamic page in the tree: it reads `searchParams`, runs
the `confirmation` Effect program and has a `loading.tsx` for the round trip.

## Metadata

Every route that needs metadata keeps a sibling `metadata.ts` exporting `generateMetadata`, which the
page re-exports (`export { generateMetadata } from './metadata';`). The split is what makes the metadata
unit-testable on its own — hence the `metadata.test.ts` next to each one.

**The shape lives in one module; each file supplies only what its route knows.** `buildMetadata` under
`@infrastructure/seo` owns `metadataBase`, the `alternates` pair, `openGraph`, `twitter`, the `robots` block
and `other`. A route file resolves `siteUrl` through [`getPublicEnv.ts`](../infrastructure/services/env/getPublicEnv.ts), pulls its copy from a `metadata.*`
namespace, and passes strings: `title`, optional `description` and `keywords`, an optional `path`, and
`indexable`. Two rules are derived rather than repeated — `openGraph` appears when there is a description,
and `images`/`twitter`/`keywords` only when the route is indexable — which is exactly what the seven files
did by hand.

They were seven copies of one 43-line shape; the four `legal/` ones were identical bar a namespace and a
path repeated three times each. The translation call stays per-route on purpose: `getTranslations` types its
keys against the namespace, so resolving the strings at the call site is what keeps a typo in a message key a
compile error instead of a runtime blank. A new route that skips the `alternates` block ships six URLs
competing for the same ranking — passing `path` is what prevents it.

## API route handlers

| Route | Method | What it does |
| --- | --- | --- |
| [`api/payment/route.ts`](./api/payment/route.ts) | POST | Creates a Stripe PaymentIntent for a Donation. Rate-limits on `cf-connecting-ip` before anything else |
| [`api/payment/activate/route.ts`](./api/payment/activate/route.ts) | GET | Stripe's `return_url`. Activates Premium and redirects to the confirmation page with the cookie already set — see *The redirect hand-off* below |
| [`api/webhooks/stripe/route.ts`](./api/webhooks/stripe/route.ts) | POST | Verifies the `stripe-signature` header, then hands the event to `processWebhookEvent`. Reads the **raw** body via `request.text()` — parsing it as JSON would break signature verification |
| [`api/check-session/route.ts`](./api/check-session/route.ts) | GET, POST | GET verifies the premium cookie; POST activates Premium from an email, optionally with a payment key, and sets the cookie |
| [`api/contact/route.ts`](./api/contact/route.ts) | POST | Contact form submission |
| [`api/markdown/route.ts`](./api/markdown/route.ts) | GET | Renders the Markdown twin of a page via [`buildMarkdownPage.ts`](../infrastructure/markdown/buildMarkdownPage.ts). Only reached through the middleware rewrite |
| [`api/health/route.ts`](./api/health/route.ts) | GET | Liveness probe. Answers `status` and `timestamp` and nothing else |

Shared conventions across them:

- The Effect program is run at the boundary — `Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer)))`
  — and every tagged failure is caught into a `NextResponse`. `Effect.catchAll` closes the tail so a route
  never rejects.
- Error bodies use the `ApiError` constants from [`src/infrastructure/api/errors.ts`](../infrastructure/api/errors.ts), never a raw message,
  except `ValidationError` and `PromoCodeError` whose messages are already user-facing.
- A JSON body is read with `parseJsonBody` ([`api/parseJsonBody.ts`](../infrastructure/api/parseJsonBody.ts)) **inside** the Effect program, never with
  a bare `await request.json()` before it. A malformed, empty or non-object body then fails as a
  `ValidationError` carrying `invalid_body` and maps onto the same 400 as a schema violation; parsing outside
  the program rejects before any `catchTags` map exists and Next answers a bare 500. The Stripe webhook is
  the exception — it needs the raw text.
- Work that must not delay the response (persisting the payment record, sending the email) is returned by
  the use-case as a `deferred` Effect and run inside Next's `after()`.
- `check-session` and `health` respond through `noStore` ([`src/infrastructure/api/response.ts`](../infrastructure/api/response.ts)). Anything
  carrying Premium state must keep doing so.

## The redirect hand-off

Some payment methods — iDEAL, Bancontact, P24, EPS, and any card that needs a redirect for 3DS — send the
payer to their bank instead of confirming inline. Stripe then resolves `confirmPayment` with **no**
`PaymentIntent`, so [`src/ui/adapters/payments/checkout.ts`](../ui/adapters/payments/checkout.ts) cannot activate anything: the browser has already
navigated away. Everything those payers get, they get on the way back.

`api/payment/activate/route.ts` is that way back. It is the `return_url` ([`premium/CheckoutForm.tsx`](../ui/modules/premium/CheckoutForm.tsx) builds
it), so Stripe appends `payment_intent`, `payment_intent_client_secret` and `redirect_status` to it. The
handler activates Premium, sets the cookie on a redirect response and sends the payer on to
`payment/confirmation`. The cookie is therefore already set when that page renders — which is why the page
stays a server component with no activation of its own. A page cannot write a cookie during render; only a
route handler or a server action can, and that constraint is what decides this shape.

**It is a GET that grants an entitlement**, which is exactly the thing to be careful about, so it carries
four guards:

- **The client secret is required and verified.** `activateWithPayment` compares it against the retrieved
  intent's own `client_secret` through `matchesClientSecret` ([`src/infrastructure/services/premium/activation.ts`](../infrastructure/services/premium/activation.ts)),
  in constant time and length-first. Without it, anyone holding a leaked payment intent id could mint a
  session. The length check is not tidiness: `charCodeAt` past the end returns `NaN`, `NaN | 0` is `0`, so a
  length-blind loop accepts any prefix.
- **`redirect_status` short-circuits.** Stripe says whether the redirect succeeded; if it did not, the
  handler never calls Stripe at all.
- **Rate-limited on `cf-connecting-ip`**, through the same `checkRateLimit` the payment route uses.
- **Never cached**, through an explicit `no-store` header on the redirect, because the response carries a
  `Set-Cookie`. It must **not** also declare `export const dynamic = 'force-dynamic'`: this app runs with
  `cacheComponents` enabled in `next.config.ts`, and Turbopack rejects that route segment config outright —
  `next build` fails with "Route segment config "dynamic" is not compatible with
  `nextConfig.cacheComponents`". The header is the whole mechanism.

Failure is never silent and never a lie: the handler redirects with `activation=failed` and the page then
renders `premiumActivationFailed` — the payer is told their money went through and their access did not,
instead of the page claiming Premium is active. That claim was unconditional once, on a page that activated
nothing, which is the bug this route exists to close.

The cookie is `sameSite: 'strict'`, so the confirmation page must **not** infer success from the cookie
being present — the payer arrives through a chain that started cross-site and the browser may withhold it on
that hop. The `activation` query parameter is the signal; the cookie is the entitlement.

**The store does not pick that cookie up on its own, which is why the page mounts
[`src/ui/modules/premium/PremiumSessionSync.tsx`](../ui/modules/premium/PremiumSessionSync.tsx).** `checkExistingSession()` returns early unless
`needsSessionCheck` is set, and only rehydration raises that flag, only when `lastVerified` is missing or
over 24 hours old — false for any donor who opened the planner before donating, since `PremiumFeature`'s own
mount stamps it. [`PremiumFeature.tsx`](../ui/modules/premium/PremiumFeature.tsx) calling `checkExistingSession()` unconditionally therefore does
nothing for the payer who has just come back. `PremiumSessionSync` renders `null` and calls
`checkExistingSession({ force: true })` once; it activates nothing — the cookie is already set, server side,
before this page renders — it only invalidates a client-side cache, which is the one thing a server
component cannot do. Deleting it as redundant reinstates the bug where a redirect donor is charged, holds a
valid cookie, is told Premium is active, and finds every feature blurred.

## The `.well-known` catch-all

`.well-known/[...slug]/route.ts` is a lookup table, not a router: it joins the slug segments and matches
against three exact keys — `api-catalog`, `mcp/server-card.json`, `agent-skills/index.json` — delegating
to [`apiCatalog.ts`](../infrastructure/well-known/apiCatalog.ts), [`mcpServerCard.ts`](../infrastructure/well-known/mcpServerCard.ts) and [`agentSkillsIndex.ts`](../infrastructure/well-known/agentSkillsIndex.ts) in `@infrastructure/well-known`. Anything
else is a 404. Add a document by adding a key; do not branch inside the handler.

**That table is a `Map`, and it has to stay one.** As a plain object it answered `/.well-known/constructor`
— and `toString`, `valueOf`, `hasOwnProperty` — with an inherited `Object.prototype` function, which passed
the `if (!handler)` guard and was then called as a handler, so the route returned 500 where it owed 404. A
`Map` has no prototype chain to walk into. Converting it back to an object literal reinstates that whole
class of path.

These paths contain a dot, so the middleware matcher excludes them — they never see locale negotiation.

**The skills index advertises only what this handler serves.** `agentSkillsIndex.ts` used to give all five
entries a `url` under `/.well-known/agent-skills/<name>/SKILL.md` and a `sha256` — every one of those URLs
404s, because the handler matches three exact keys and none of them is a `SKILL.md`, and every digest was
`e3b0c442…`, the SHA-256 of the empty string. The two entries describing a document that does exist now
point at it; the three describing a *behaviour* carry no `url` at all, and nothing carries a digest, because
none of these is a file whose bytes could be hashed. Adding an entry with a URL means adding the key here
first.

## Error and not-found boundaries

| File | Catches |
| --- | --- |
| `[locale]/(marketing)/error.tsx` | Errors in marketing pages. Renders inside the marketing layout, so it emits bare content — header and footer are already there |
| `[locale]/error.tsx` | Everything else under `[locale]/`, including the whole `(app)` group, which has no boundary of its own. Wraps its content in a full-height shell because there is no chrome around it |
| `global-error.tsx` | Failures of the root layout itself. React has unmounted the layout, so this file renders its own `<html>`/`<body>` and re-applies the font variables |
| `[locale]/not-found.tsx` | `notFound()` raised inside a matched locale segment |
| `global-not-found.tsx` | URLs that match no route at all, so no layout ran. Enabled by `experimental.globalNotFound` in `next.config.ts`; it re-detects the locale itself from the `x-next-intl-locale` header, then the locale cookie, then `Accept-Language` |

`global-error.tsx` bundles **only** [`en.json`](../ui/i18n/messages/en.json) and hard-codes `lang="en"` on the document. That is
deliberate: pulling all six catalogues into the root bundle would cost every route roughly 500 KB for a
page most users never see. Do not "fix" the mismatch between the URL locale and the rendered language by
importing the other five.

## Cloudflare request context

`getCloudflareContext()` may be read here and in server actions, never in a use-case — see
[ADR 0004](../../docs/adr/0004-cloudflare-workers-as-deployment-target.md). In this folder the readers are
`api/contact/route.ts`, `api/markdown/route.ts`, `.well-known/[...slug]/route.ts`, `sitemap.ts` and
`robots.ts`; the `metadata.ts` files reach it indirectly through `getPublicEnv.ts`.

The `{ async: true }` form is not interchangeable with the bare call, but the split is not request versus
no-request. Only the async form works where there may be no request, so everything evaluable outside one —
`sitemap.ts`, `robots.ts`, the `.well-known` handler, `getPublicEnv.ts` under `'use cache'` — must use it.
The reverse does not hold: `api/markdown/route.ts` uses the async form and only ever runs inside a GET,
because the async form is always safe. `api/contact/route.ts` uses the sync one. Copying a *sync* call into
a prerendered path is the failure mode to watch for; copying an async one costs nothing.

Config is read off the context and passed down as plain values; use-cases receive `{ siteUrl, contactEmail }`
rather than reaching for the environment themselves.

## SEO files

**One table says which routes exist and which are public.** `SITE_ROUTES` under `@infrastructure/seo` carries
a `path`, an `indexable` flag and the sitemap hints, and three readers derive from it: `sitemap.ts` emits the
cross-product of the six locales and `indexableRoutes()`, `robots.ts` disallows every locale-expanded
`privateRoutes()` path, and each `metadata.ts` asks `isIndexable(PATH)` rather than restating the answer.
**Adding a route is one row.**

That used to be three edits in three files — a `ROUTES` entry, a `DISALLOWED_PAGES` prefix, and
`robots: { index: false }` — with nothing tying them together. It also closed a hole: `DISALLOWED_PAGES`
blocked the prefixes `/legal/` and `/payment/`, so a private route anywhere else was disallowed by nobody.
`isIndexable` **fails closed** — a path with no row is treated as private — so the failure mode of forgetting
the table is a page missing from the sitemap, not a private page advertised to crawlers. [`routes.test.ts`](../infrastructure/seo/routes.test.ts)
pins that, and [`robots.test.ts`](./robots.test.ts) additionally pins that nothing the sitemap advertises is disallowed.

Both files resolve the base URL from the Cloudflare env rather than a constant. Only `sitemap.ts` gets the
host it is actually served from, though: `robots.ts` is prerendered, so it bakes whatever the build resolved
— see the Deploy section of the root [`CLAUDE.md`](../../CLAUDE.md).

## Structured data

[`src/ui/modules/shared/seo/JsonLd.tsx`](../ui/modules/shared/seo/JsonLd.tsx) exports two components, mounted on different pages on purpose.
`JsonLd` carries the `WebApplication` and `Organization` schemas and sits on `/planner`; `FaqJsonLd` carries
the `FAQPage` schema and sits on the homepage, **because that is the page that renders the FAQ**. Search
engines expect the marked-up questions to be visible on the page carrying the markup, and the FAQ schema was
emitted on the planner, which has no FAQ on it at all.

The Premium offer states a `priceSpecification` with a `minPrice`, not a fixed price. Premium is unlocked by
a Donation the payer chooses — [`src/application/dto/payment/schema.ts`](../application/dto/payment/schema.ts) accepts 1 to 10000 — so the fixed
4.99 it used to advertise was simply untrue. If the minimum moves, `MINIMUM_DONATION` and that Zod bound
move together.

## Fonts

`fonts.ts` declares Bricolage Grotesque, Space Grotesk, Instrument Serif and JetBrains Mono, each with a
`--font-*` CSS variable and `display: 'swap'`. Import the handles and spread `.variable` onto `<body>`;
three files do this — `[locale]/layout.tsx`, `global-error.tsx` and `global-not-found.tsx` — and a new
document-rendering file must do it too or it will render in the fallback stack. The variables are consumed
by the Tailwind theme in `@styles`, never by class names in this folder.

## Testing

Every route file has a co-located test: `.test.ts` for handlers, `sitemap.ts`, `robots.ts` and the
`metadata.ts` files, `.test.tsx` for pages, layouts and error boundaries. `loading.tsx` and `fonts.ts` are
the exceptions — neither has behaviour worth asserting.

Handler tests mock the infrastructure module rather than the Effect layer where it is cheaper to do so
([`api/health/route.test.ts`](./api/health/route.test.ts) stubs `@infrastructure/api/response`), and reach for `vi.stubEnv` when a route
reads the environment. Keep the `await import('./route')` after the mocks: route modules read their
dependencies at module scope, so a top-level import would bind the real ones.

## Gotchas

- **Two guards protect the confirmation page.** The middleware redirects when `payment_intent` is missing
  *and* `page.tsx` redirects again. Removing either leaves the Effect program running with `undefined`.
- **That redirect sets `pathname` on a parsed URL; it must never resolve a path as a relative reference.**
  The target is the request path with `/payment/confirmation` sliced off, and it was built as
  `new URL(homePath, request.url)`. A pathname beginning with two slashes is *protocol-relative*, so that
  expression returns a different origin entirely — and `config.matcher` does not stop one arriving, because
  its only exclusion beyond `/api` and `/_next` is a **literal** dot: `//1234567890/payment/confirmation`
  carries none, and a leading `/%2e` is stripped as a dot segment after the match, leaving the doubled slash
  behind. A visitor following a `/payment/` link on this domain was answered `307` to whatever host the path
  spelled. `homePath` is now forced to a single leading slash and assigned to `new URL(request.url).pathname`,
  which cannot change the origin whatever it contains. `src/middleware.test.ts` asserts the origin survives.
- **`api/health/route.ts` is public and unauthenticated**, and `.well-known/api-catalog` advertises it, so
  the body says the app is up and nothing else. Do not add configuration to it — not which secrets are set,
  not the `NODE_ENV`, not a dependency check that names a host.
- **The middleware's Markdown rewrite trusts `config.matcher` to keep internal paths out.** The matcher
  excludes `/api` and every dotted path, so `/.well-known/*` and the other route handlers never reach the
  middleware at all; the rewrite branch has no guard of its own. Widening the matcher means adding one back,
  which is what the `config matcher` block in `src/middleware.test.ts` is there to catch.
- **The planner page imports its sections through `next/dynamic`.** That is a bundle-size decision, not an
  accident; a static import of `CalendarList` or `Summary` pulls the whole planning UI into the first load.
