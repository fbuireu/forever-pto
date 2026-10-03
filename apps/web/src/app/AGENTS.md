# apps/web/src/app

## Purpose

The Next.js App Router tree: every URL the app answers, plus the file-convention entry points Next.js
discovers by name ([`sitemap.ts`](./sitemap.ts), [`robots.ts`](./robots.ts), [`global-error.tsx`](./global-error.tsx), [`global-not-found.tsx`](./global-not-found.tsx), `favicon.ico`).

This folder is a thin shell. Pages compose components from `@ui/*`; route handlers parse the request, run
an operation from `@infrastructure/api/operations` or an Effect program of their own against
`ApplicationLayer`, and put the outcome on a response.

## The tree

| Path | Role |
| --- | --- |
| `[locale]/layout.tsx` | **The root layout.** There is no layout file at the `src/app` root; this is the only file that renders `<html>`/`<body>` on the normal path |
| `[locale]/(app)/planner/` | The planner screen: sidebar chrome in `layout.tsx`, content in `page.tsx` |
| `[locale]/(app)/payment/confirmation/` | Post-Stripe landing page; reads `payment_intent` from the query string |
| `[locale]/(marketing)/` | Homepage (`page.tsx`) and its header/footer shell (`layout.tsx`) |
| `[locale]/(marketing)/legal/` | Privacy policy, cookie policy, terms of service, legal notice |
| `api/` | The route handlers; see below |
| `.well-known/[...slug]/` | Catch-all serving the static JSON documents |
| [`fonts.ts`](./fonts.ts) | The `next/font/google` families, and `DOCUMENT_BODY_CLASS`, the `<body>` class that registers their CSS variables |
| `sitemap.ts`, `robots.ts` | SEO file conventions |
| `global-error.tsx`, `global-not-found.tsx` | Last-resort boundaries that render their own document |

## How a request reaches a page

[`src/middleware.ts`](../middleware.ts) runs first, and its `config.matcher` decides what it sees: everything except `/api`,
`/_next`, `/_vercel` and any path containing a dot, plus `/api/markdown` explicitly. In order it:

1. Lets a direct `/api/markdown` request through, and **overwrites the path header** on the way; see below.
   The branch is not decoration: without it a direct hit carrying `Accept: text/markdown` would match the
   next rule and rewrite the route onto itself.
2. Rewrites any request carrying `Accept: text/markdown` to `/api/markdown`, passing the pathname in an
   `x-markdown-path` **request header**, so every HTML URL has a Markdown twin without a second route
   existing. **The Markdown twin reads `SITE_ROUTES`, the same table the sitemap, `robots.txt` and every
   `generateMetadata` read**, so adding a route is one row.

   **The lookup is an exact match on the locale-stripped path, and that is load-bearing.**
   `routePathFromPathname` drops the locale segment and `findRoute` compares with `===`; a substring or prefix
   match would serve `/legal/privacy-policy-2024` as the privacy policy. `buildMarkdownPage` answers `null`
   for an unlisted path and [`api/markdown/route.ts`](./api/markdown/route.ts) turns that into a **404**, so the twin never tells a
   crawler or an agent that a page exists when its HTML is the app's 404. The `Vary: Accept` header is on
   the 404 too, so a shared cache cannot serve one representation for the other.
3. Redirects `**/payment/confirmation` to the locale home when `payment_intent` is absent.
4. Runs the `next-intl` middleware, which negotiates the locale and fills the `[locale]` segment.
5. Re-writes the `NEXT_LOCALE` cookie next-intl just set, through `setLocaleCookie`
   ([`src/infrastructure/i18n/cookie.ts`](../infrastructure/i18n/cookie.ts)), which applies `LOCALE_COOKIE_POLICY`: `secure`,
   `sameSite: 'lax'`, `path: '/'`. **It is the same object `routing.ts` gives next-intl**, which is the
   point: the client-side language switcher writes this cookie too, from `document.cookie`, and both
   writers have to agree, which is also why it carries no `httpOnly`: that would break every soft locale
   switch. See [`src/infrastructure/AGENTS.md`](../infrastructure/AGENTS.md). [`middleware.test.ts`](../middleware.test.ts) guards the step under
   `describe('locale cookie policy')`; the policy itself is asserted in
   [`src/infrastructure/i18n/cookie.test.ts`](../infrastructure/i18n/cookie.test.ts).
6. Hands the response to the location proxy ([`src/infrastructure/proxy/location.ts`](../infrastructure/proxy/location.ts)), which sets the
   detected-country cookie.

Security headers are **not** set here. They are the `SECURITY_HEADERS` array in [`next.config.ts`](../../next.config.ts), applied
through `async headers()` on `source: '/(.*)'`, which, unlike this matcher, really does cover every request.

**The pathname travels in a header because a rewrite does not change what the handler reads from the URL.**
Inside a route handler `request.url` is the URL the *visitor* asked for, not the rewrite target, so a query
the proxy appended would never arrive. The proxy `set`s the header, which overwrites anything inbound, and
the direct-hit branch `set`s it to `NEUTRALISED_MARKDOWN_PATH`. The route reads *only* the header and 404s
unless `isProxiedMarkdownPath` accepts it, with no fallback to the query: the fallback is the
vulnerability, not a convenience, since `/planner?path=/legal/terms-of-service` would serve the terms of
service under the planner's URL, cacheable for an hour. `middleware.test.ts` asserts both overwrites;
`route.test.ts` asserts the header wins over a disagreeing query and that neither an absent nor a
neutralised header reaches the builder.

**The direct-hit branch overwrites because deleting does not survive the adapter, and that is not a style
choice.** Next serialises `NextResponse.next({ request: { headers } })` as `x-middleware-override-headers`
plus one `x-middleware-request-<key>` per header, and Next's own router applies it by *deleting* every
original header absent from that list. `@opennextjs/aws` does not: `dist/core/routing/middleware.js` ends on
`headers: { ...internalEvent.headers, ...reqHeaders }`, a merge, so a deleted header is simply not
overridden and the caller's value survives, on the edge and Node.js middleware paths alike. Overwriting is
expressible in the mechanism that does exist, which is why the sentinel lives in `twin.ts` beside the header
name rather than being an empty string spelled twice. Only [`markdown.spec.ts`](../../e2e/api/markdown.spec.ts) can catch a regression here:
`middleware.test.ts` calls the exported function and reads what was handed to `NextResponse.next`, so it
sees the intent and never the runtime.

**[`markdown.spec.ts`](../../e2e/api/markdown.spec.ts) drives the twin the way a client does, and it is the only place the proxy,
the route and the header are proven to line up.** It requests the **page** route with
`Accept: text/markdown` and asserts what the twin produces on each branch, plus the claims no unit test
can reach: a bare `GET /api/markdown` 404s, so the overwrite is live end to end, and
`/planner?path=/legal/terms-of-service` serves the planner. It imports `MARKDOWN_ACCEPT`,
`MARKDOWN_PATH_HEADER` and `MARKDOWN_ROUTE` from [`src/infrastructure/markdown/twin.ts`](../infrastructure/markdown/twin.ts) rather than repeating
the strings, and asserts the cache headers directionally (a hit is `public` with a positive `max-age` and no
`no-store`, a miss has `no-store`).

**One module states the cache policy, and it is the one that knows the outcome.**
[`src/infrastructure/markdown/twin.ts`](../infrastructure/markdown/twin.ts) owns `MARKDOWN_ROUTE`, `MARKDOWN_ACCEPT`, `MARKDOWN_PATH_HEADER` and
`markdownTwinHeaders({ found })`: content type, `Cache-Control` and `Vary` together. A hit is
`public, max-age=3600` and a miss is `no-store`; the proxy states no cache policy at all, because it runs
before `buildMarkdownPage` and cannot know whether the page exists.

`Vary: Accept` is on both branches. The body served under an HTML URL depends on the `Accept` header, so a
shared cache keyed on the URL alone would hand the Markdown twin to the next visitor asking for HTML.

**The HTML half of that pair does *not* carry `Vary: Accept`, and that is a known gap rather than an
oversight.** The app itself is safe: the proxy runs before any cache lookup, so a markdown request is
rewritten and never reaches the HTML cache entry, but an intermediary cache could store the HTML for
`/planner` keyed on the URL alone and then serve it to a client asking for markdown. Closing it means adding
`Vary: Accept` to `SECURITY_HEADERS`' `source: '/(.*)'` in `next.config.ts`, which applies to every asset and
fragments the CDN cache on a header browsers send in wildly varying forms. That is a hit-rate decision with a
real cost, not a refactor, so it is written down here instead of being made in passing.

`localePrefix` is `as-needed` with `en` as the default ([`src/infrastructure/i18n/routing.ts`](../infrastructure/i18n/routing.ts)), so English
URLs carry **no** `/en` prefix while the others do; `localePath` and `localeAlternates` in
[`src/infrastructure/i18n/utils/url.ts`](../infrastructure/i18n/utils/url.ts) know it.

`[locale]/layout.tsx` re-validates the segment with `hasLocale` and calls `notFound()`: the proxy is
not treated as the only gate, because a statically rendered path can arrive without it.

Every page and layout under `[locale]/` that reads translations **from the request locale** calls
`setRequestLocale(locale)` first; the `legal/` pages and `payment/confirmation/page.tsx` pass the locale to
`getTranslations` instead (`getTranslations({ locale, namespace })`). next-intl's `Link` reads the request locale
whatever the page passes, so the internal links `createRichLink` renders on `privacy-policy` and `cookie-policy` read
the value `legal/layout.tsx` sets.

## The route groups

Groups do not affect the URL: `(app)` and `(marketing)` exist purely to give different chromes.

**`(marketing)`** has a group-level `layout.tsx` (header, footer, toaster, and the quick start dialog the header's
trial action opens, mounted here so one instance serves every trigger on the page) and its own `error.tsx`. Its
pages are fully static: `page.tsx` declares `generateStaticParams`, and indexability comes off `SITE_ROUTES`
rather than out of the page: the homepage's row says indexable, every `legal/` row says it is not.

**`(app)`** has *no* group-level layout. The sidebar shell lives one level down in `planner/layout.tsx`,
so `payment/confirmation/` deliberately renders bare; a Stripe return should not come back into the
planner chrome. The confirmation route renders per request, as `global-not-found.tsx` does: it reads
`searchParams`, runs the `confirmation` Effect program and has a `loading.tsx` for the round trip.

**`planner/layout.tsx` mounts the app's only `SidebarProvider`, and [`AppSidebar.tsx`](../ui/modules/sidebar/AppSidebar.tsx) mounts
none**: it returns a fragment and takes the context from here, so every consumer (`SidebarTrigger`, `Logo`,
`ManagementBar`, `StoresInitializer`) reads the same sidebar. `Sidebar.test.tsx` asserts the mount site is unique.

## Metadata

A route's metadata is the one-line `routeMetadata` call in its `page.tsx`; see *SEO files* below.

**The shape lives in one module; each row supplies only what its route knows.** `buildMetadata` under
`@infrastructure/seo` owns `metadataBase`, the `alternates` pair, `openGraph`, `twitter`, the `robots` block
and `other`. `routeMetadata` resolves `siteUrl` through [`getPublicEnv.ts`](../infrastructure/services/env/getPublicEnv.ts), translates the row's `titleKey`
and `descriptionKey` in the `metadata` namespace, and passes strings: `title`, optional `description` and
`keywords`, and a **required `route`**. Rules are derived rather than repeated: `openGraph` appears when there
is a description, and `images`/`twitter`/`keywords` only when the route is indexable.

`indexable` is a pure function of the path, so `buildMetadata` calls `isIndexable(route)` itself and
`SITE_ROUTES` is the only thing that decides. `route` is required, so no page canonicalises through a `'/'`
fallback, and a new route cannot skip the `alternates` block and ship a URL per locale competing for the same
ranking.

## API route handlers

| Route | Method | What it does |
| --- | --- | --- |
| [`api/payment/route.ts`](./api/payment/route.ts) | POST | Creates a Stripe PaymentIntent for a Donation. `createPaymentRequest` rate-limits on the client address (`resolveClientIp`) before it reads the body |
| [`api/payment/activate/route.ts`](./api/payment/activate/route.ts) | GET | Stripe's `return_url`. Activates Premium and redirects to the confirmation page with the cookie already set; see *The redirect hand-off* below |
| [`api/webhooks/stripe/route.ts`](./api/webhooks/stripe/route.ts) | POST | Verifies the `stripe-signature` header, then hands the event to `processWebhookEvent`. Reads the **raw** body via `request.text()`; parsing it as JSON would break signature verification |
| [`api/check-session/route.ts`](./api/check-session/route.ts) | GET, POST | GET verifies the premium cookie; POST activates Premium from an email, optionally with a payment key, and sets the cookie. GET treats "did not verify" and "could not verify" differently: see *The GET half of check-session distinguishes did not verify from could not verify* below |
| [`api/contact/route.ts`](./api/contact/route.ts) | POST | Contact form submission, through `sendContactRequest`. No IP rate limit: `sendContactEmail` refuses a sender inside the cooldown or a repeated message; see [`../application/use-cases/AGENTS.md`](../application/use-cases/AGENTS.md) |
| `api/markdown/route.ts` | GET | Renders the Markdown twin of a page via [`buildMarkdownPage.ts`](../infrastructure/markdown/buildMarkdownPage.ts). Only reached through the proxy rewrite, and only *drivable* through it: the pathname comes from the `x-markdown-path` header, never the query string |
| [`api/health/route.ts`](./api/health/route.ts) | GET | Liveness probe. Answers `status` and `timestamp` and nothing else |

A flow behind more than one transport (payment, contact, Premium activation) runs in its operation under
`@infrastructure/api/operations`, which provides `ApplicationLayer`, maps every tagged failure through
`describeFailure` and hands the route an outcome that carries the status; the route only puts it on a response. The
Stripe webhook and the `GET` of `check-session` run their own program. Error bodies carry the `ApiError` constants from
[`src/infrastructure/api/errors.ts`](../infrastructure/api/errors.ts), and a JSON body is read with `parseJsonBody`
([`api/parseJsonBody.ts`](../infrastructure/api/parseJsonBody.ts)) inside the program, so a malformed body fails as a
`ValidationError` carrying `invalid_body` and maps onto the same 400 as a schema violation. Work that must not delay the
response (the payment record and its status, the contact row's message id) runs inside Next's `after()`.
`check-session`, `health`, `payment` and `contact` respond through `noStore`
([`src/infrastructure/api/response.ts`](../infrastructure/api/response.ts)), and each one's `route.test.ts` asserts
`no-store` on its branches through the real one.

## The GET half of check-session distinguishes *did not verify* from *could not verify*

`api/check-session`'s `GET` answers 200 with `{ premiumKey: null, email: null }` on a `SessionError` rather
than a status, because an expired token is a normal state and not a failure. That is true of *one* of the
conditions `verifySession` can hit: an expired token, a bad signature and a rotated `JWT_SECRET` fail the
same way, and so does an **absent** `JWT_SECRET`, because `getJWTSecret()` throws synchronously inside the
`Effect.tryPromise` thunk and Effect routes a sync throw through the same `catch`. One branch for all of
them would log every live session holder out when a variable drops from the environment, **delete their
cookie on the way**, and emit nothing.

The split is made at the source rather than in the route.
[`session.ts`](../infrastructure/services/premium/session.ts) throws `MissingJWTSecret` out of
`getJWTSecret`, and [`sessionErrors.ts`](../infrastructure/services/premium/sessionErrors.ts) beside it owns
the whole vocabulary: that sentinel, `SessionConfigurationError`, `isSessionConfigurationError` and the
`wrapSessionError` both `Effect.tryPromise` blocks hand to `catch`. `SessionConfigurationError` is a subclass
of `SessionError` adding no members, the same shape
[`serverService.ts`](../infrastructure/clients/payments/stripe/serverService.ts) uses for
`WebhookConfigurationError`, and for the same reason: the `_tag` is unchanged, so every caller's error
channel, `TaggedFailure` and `describeFailure` are untouched, and `isSessionConfigurationError` narrows where
the difference matters. It sits in its own file because the classification is what the route reads, and
importing it should not pull `jose` and the signing path in behind it. The policies that follow from it:

- **did not verify**: the token is expired, malformed or signed by something else. Clear the cookie, stay
  silent, answer 200. Normal.
- **could not verify**: `JWT_SECRET` is absent, so nothing about the token was established either way.
  **Keep the cookie** and log at error. Keeping it is the point: the moment the variable comes back the
  session works again, and the operator gets a line instead of a support ticket.

This changes nothing about what the cookie gates.
[ADR 0007](../../../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md) is about the threat
model, not observability.

**A rotated secret lands in the silent branch and cannot be lifted out of it.** Rotation makes every live
token fail the MAC, which is byte-for-byte the failure a forged token produces, so no per-token evidence
separates them. And `GET` carries no rate limiter, so logging signature failures at error would hand an
anonymous caller the log budget. The configuration branch catches the absent variable, which is the half that
is decidable. Do not "complete" the split by promoting a signature failure to `SessionConfigurationError`.

**The `GET` provides `ApplicationLayer` for that log line**, which goes through the `LoggerService` tag like
every other route's. Every Live layer is `Layer.sync` and reads no environment at construction, so providing
them costs a closure each.

## The redirect hand-off

Some payment methods (iDEAL, Bancontact, P24, EPS, and any card that needs a redirect for 3DS) send the
payer to their bank instead of confirming inline. Stripe then resolves `confirmPayment` with **no**
`PaymentIntent`, so [`src/ui/adapters/payments/checkout.ts`](../ui/adapters/payments/checkout.ts) cannot activate anything: the browser has already
navigated away. Everything those payers get, they get on the way back.

`api/payment/activate/route.ts` is that way back. It is the `return_url` ([`premium/CheckoutForm.tsx`](../ui/modules/premium/CheckoutForm.tsx) builds
it), so Stripe appends `payment_intent`, `payment_intent_client_secret` and `redirect_status` to it. The
handler activates Premium, sets the cookie on a redirect response and sends the payer on to
`payment/confirmation`. The cookie is therefore already set when that page renders, which is why the page
stays a server component with no activation of its own. A page cannot write a cookie during render; only a
route handler or a server action can, and that constraint is what decides this shape.

**It is a GET that grants an entitlement**, which is exactly the thing to be careful about, so it carries
guards:

- **The client secret is required and verified, by the type as well as by this route.**
  `activateWithPayment` takes `{ paymentIntentId, clientSecret }` with both required, and compares the secret
  against the retrieved intent's own `client_secret` through `matchesClientSecret`
  ([`src/infrastructure/services/premium/activation.ts`](../infrastructure/services/premium/activation.ts)), in constant time and length-first. Without it,
  anyone holding a leaked payment intent id could mint a session. The length check is not tidiness: the loop
  runs over the expected secret's length, so without it any string that starts with the secret would pass.

  [`activatePremium.ts`](../application/use-cases/activatePremium.ts) exports one entry point per caller over one private implementation,
  `activateWithPayment({ paymentIntentId, clientSecret })` for this route and
  `activateWithClaimedPayment({ paymentIntentId, expectedEmail })` for the `POST /api/check-session`
  recovery path, so neither guard is optional. [ADR 0008](../../../../adr/0008-premium-derived-from-payment.md) accepts that the recovery path grants
  Premium to whoever types an address with a succeeded payment behind it.
- **`redirect_status` short-circuits.** Stripe says whether the redirect succeeded; if it did not, the
  handler never calls Stripe at all.
- **Rate-limited on the client address** (`resolveClientIp`), through the same `checkRateLimit` the payment
  route uses.
- **Never cached**, through an explicit `no-store` header on the redirect, because the response carries a
  `Set-Cookie`. It declares no `export const dynamic`: the route is dynamic by construction, and the header
  is the whole mechanism; `sitemap.ts` is the one route that declares it.

**Failure is logged once, by the operation.** Both transports go through `activatePremiumRequest` in
[`@infrastructure/api/operations`](../infrastructure/api/AGENTS.md), which owns the deferred hand-off, the tag→status map and one log line
per failure: `warn` for a refusal the payer caused, `error` for Stripe, the session and the database. The
route keeps only what is its own: the redirect, the cookie and the `no-store` header.

Failure is never silent and never a lie: the handler redirects with `activation=failed` and the page then
renders `premiumActivationFailed`: the payer is told their money went through and their access did not,
instead of the page claiming Premium is active.

The cookie is `sameSite: 'strict'`, so the confirmation page must **not** infer success from the cookie
being present: the payer arrives through a chain that started cross-site and the browser may withhold it on
that hop. The `activation` query parameter is the signal; the cookie is the entitlement.

**The store does not pick that cookie up on its own, which is why the page mounts
[`src/ui/modules/premium/PremiumSessionSync.tsx`](../ui/modules/premium/PremiumSessionSync.tsx).** `checkExistingSession()` returns early unless
`needsSessionCheck` is set, and only rehydration raises that flag, only when `lastVerified` is missing or
over 24 hours old: false for any donor who opened the planner before donating, since `PremiumFeature`'s own
mount stamps it. [`PremiumFeature.tsx`](../ui/modules/premium/PremiumFeature.tsx) calling `checkExistingSession()` unconditionally therefore does
nothing for the payer who has just come back. `PremiumSessionSync` renders `null` and calls
`checkExistingSession({ force: true })` once; it activates nothing (the cookie is already set, server side,
before this page renders); it only invalidates a client-side cache, which is the one thing a server
component cannot do. Deleting it as redundant reinstates the bug where a redirect donor is charged, holds a
valid cookie, is told Premium is active, and finds every feature blurred.

## The `.well-known` catch-all

`.well-known/[...slug]/route.ts` is a lookup table, not a router: it joins the slug segments and asks
`lookupWellKnownDocument` for an exact key (`api-catalog`, `mcp/server-card.json`, `agent-skills/index.json`),
each backed by [`apiCatalog.ts`](../infrastructure/well-known/apiCatalog.ts), [`mcpServerCard.ts`](../infrastructure/well-known/mcpServerCard.ts) or [`agentSkillsIndex.ts`](../infrastructure/well-known/agentSkillsIndex.ts) in `@infrastructure/well-known`. Anything
else is a 404. The table is a `Map` behind `lookupWellKnownDocument(slug)` in
[`documents.ts`](../infrastructure/well-known/documents.ts), and `wellKnownSlugs()` is what the agent-skills test
enumerates.

These paths contain a dot, so the proxy matcher excludes them; they never see locale negotiation.

**The skills index advertises only what this handler serves.** [`well-known/slugs.ts`](../infrastructure/well-known/slugs.ts) holds the slugs and
`wellKnownUrl`, `well-known/documents.ts` maps each slug to its content type and builder, and the index
interpolates the same constants. An entry that describes a *behaviour* rather than a served document carries
no `url`, and none carries a digest, because none of these is a file whose bytes could be hashed.
[`agentSkillsIndex.test.ts`](../infrastructure/well-known/agentSkillsIndex.test.ts) asserts every advertised URL resolves to a served key.

The route owns the envelope: the document's `Content-Type`, and a cache policy on both branches, the 200's
`WELL_KNOWN_CACHE_CONTROL` (`public, max-age=86400`) and the 404's `WELL_KNOWN_MISSING_CACHE_CONTROL` (`no-store`),
declared together in `slugs.ts`. A 404 with no `Cache-Control` is heuristically cacheable under RFC 9111, and this one
offers no `Last-Modified` to bound the guess.

## Error and not-found boundaries

| File | Catches |
| --- | --- |
| `[locale]/(marketing)/error.tsx` | Errors in marketing pages. Renders inside the marketing layout, so it emits bare content: header and footer are already there |
| `[locale]/error.tsx` | Everything else under `[locale]/`, including the whole `(app)` group, which has no boundary of its own. Wraps its content in a full-height shell because there is no chrome around it |
| `global-error.tsx` | Failures of the root layout itself. React has unmounted the layout, so this file renders its own `<html>`/`<body>` and re-applies the font variables |
| `[locale]/not-found.tsx` | `notFound()` raised inside a matched locale segment |
| `global-not-found.tsx` | URLs that match no route at all, so no layout ran. Enabled by `experimental.globalNotFound` in `next.config.ts`; it re-detects the locale itself from the `x-next-intl-locale` header, then the locale cookie, then `Accept-Language` |

`global-error.tsx` bundles **only** [`en.json`](../ui/i18n/messages/en.json) and hard-codes `lang="en"` on the document. That is
deliberate: pulling every catalogue into the root bundle would cost every route roughly 500 KB for a
page most users never see. Do not "fix" the mismatch between the URL locale and the rendered language by
importing the others. It still costs every route the whole of `en.json`, about 26 KB compressed, because a client
component's JSON import is bundled whole; sending it `clientMessagesOf` would not help, since the import is the
cost. Loading the bundle lazily is not the fix either: this page is what renders when a chunk failed to load. A
subset file derived from `en.json` at build time is the fix, and it needs that build step first.

## Cloudflare request context

`getCloudflareContext()` is read here and in server actions, never in a use-case
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). In this folder the only direct readers are
`api/markdown/route.ts` and `.well-known/[...slug]/route.ts`. `api/contact/route.ts` reaches it through
[`getRequestPublicEnv.ts`](../infrastructure/services/env/getRequestPublicEnv.ts), the per-request reader it shares with the contact server action; `sitemap.ts`,
`robots.ts`, `routeMetadata` and the four `legal/` pages reach it through `getPublicEnv.ts`, the async reader
that also works at build.

The `{ async: true }` form is not interchangeable with the bare call, but the split is not request versus
no-request. Only the async form works where there may be no request, so everything evaluable outside one
(`sitemap.ts`, `robots.ts`, the `.well-known` handler, `getPublicEnv.ts`) must use it.
The reverse does not hold: `api/markdown/route.ts` uses the async form and only ever runs inside a GET,
because the async form is always safe. `api/contact/route.ts` uses the sync one. Copying a *sync* call into
a prerendered path is the failure mode to watch for; copying an async one costs nothing. Use-cases receive
`{ siteUrl, contactEmail }` as plain values.

## SEO files

**One table says which routes exist, which are public, and what each is called.** `SITE_ROUTES` under
`@infrastructure/seo` carries a `path`, an `indexable` flag, the sitemap hints and the `metadata.*` message
keys, and its readers derive from it: `sitemap.ts` emits the cross-product of the locales and
`indexableRoutes()`, `robots.ts` disallows every locale-expanded `privateRoutes()` path, `buildMetadata`
resolves `isIndexable(route)` for itself, `buildMarkdownPage` looks the title and description up through
`findRoute`, and `routeMetadata` builds the whole `generateMetadata` from the row.

**Adding a route is one row and one line.** A route file is:

```ts
export const generateMetadata = routeMetadata('/legal/privacy-policy');
```

`routeMetadata` takes a `RoutePath`, the literal union of the table's own `path` values, so a typo is a
compile error rather than a silent fallthrough. `routeFor` is what makes the lookup total where `findRoute`
cannot be: it indexes a record derived from `SITE_ROUTES` and keyed by that same union, so it returns a row
rather than `row | undefined`. The one cast in [`routes.ts`](../infrastructure/seo/routes.ts) is where that record is built, and it is safe
because the table is the only source of both its keys and its values.

[`routeMetadata.test.ts`](../infrastructure/seo/routeMetadata.test.ts) holds the table to two properties: no two routes share a `titleKey`, and
every key resolves to a real message in `en.json`. What `buildMetadata` does with the strings is
[`buildMetadata.test.ts`](../infrastructure/seo/buildMetadata.test.ts)'s.

`SITE_ROUTES` is declared `as const satisfies readonly SiteRoute[]`: the literal `titleKey` types are what let `t()`
reject a typo in a message key at compile time, in `routeMetadata` and in `buildMarkdownPage`'s `createTranslator`
alike, and widening them to `string` compiles and fails at runtime with a blank heading.

`isIndexable` **fails closed** (a path with no row is treated as private), so the failure mode of forgetting
the table is a page missing from the sitemap, not a private page advertised to crawlers. [`routes.test.ts`](../infrastructure/seo/routes.test.ts)
pins that, and [`robots.test.ts`](./robots.test.ts) additionally pins that nothing the sitemap advertises is disallowed.

Both files resolve the base URL from the Cloudflare env rather than a constant. Only `sitemap.ts` gets the
host it is actually served from, though: `robots.ts` is prerendered, so it bakes whatever the build resolved;
see *Deploy* in the package guide, [`../../AGENTS.md`](../../AGENTS.md).

## Structured data

[`src/ui/modules/shared/seo/JsonLd.tsx`](../ui/modules/shared/seo/JsonLd.tsx) exports its components, mounted on different pages on purpose.
`JsonLd` carries the `WebApplication` and `Organization` schemas and sits on `/planner`; `FaqJsonLd` carries
the `FAQPage` schema and sits on the homepage, **because that is the page that renders the FAQ**: search
engines expect the marked-up questions to be visible on the page carrying the markup.

The Premium offer states a `priceSpecification` with a `minPrice`, not a fixed price, because Premium is
unlocked by a Donation the payer chooses, between `AMOUNT_MIN` and `AMOUNT_MAX` in
[`src/application/dto/payment/schema.ts`](../application/dto/payment/schema.ts). `MINIMUM_DONATION` reads `AMOUNT_MIN` out of that schema, so they
cannot drift.

## Fonts

`fonts.ts` declares Bricolage Grotesque, Space Grotesk, Instrument Serif and JetBrains Mono, each with a
`--font-*` CSS variable and `display: 'swap'`, and joins their `.variable` classes into `DOCUMENT_BODY_CLASS`.
The document-rendering files put that class on `<body>` (`[locale]/layout.tsx`, `global-error.tsx` and
`global-not-found.tsx`), and a new document-rendering file must do it too or it will render in the fallback
stack. The variables are consumed by the Tailwind theme in `@styles`, never by class names in this folder.

## Testing

`fonts.ts` holds configuration and no behaviour, and [`vitest.config.ts`](../../vitest.config.ts) leaves it out of coverage. Metadata is
not tested here: each page is one `routeMetadata(path)` call, and `routeMetadata.test.ts` owns the behaviour.

Handler tests keep the `await import('./route')` after the mocks: `vi.mock` is hoisted above a static import, but its
factory then runs before the test file's own `const`s exist, so a factory that closes over one throws (`vi.hoisted` is
the other way out). [`api/health/route.test.ts`](./api/health/route.test.ts) runs the real `noStore`.

## Gotchas

- **Every route shell owes the skip link a landmark.** `[locale]/layout.tsx` renders `SkipToContent` on
  every page, and its `href` is built from `MAIN_CONTENT_ID` in
  [`../ui/modules/layout/SkipToContent.tsx`](../ui/modules/layout/SkipToContent.tsx). The shells carry that
  id: `[locale]/(marketing)/page.tsx`, `[locale]/(marketing)/legal/layout.tsx`,
  `[locale]/(app)/payment/confirmation/page.tsx`, and, through the modules they compose,
  `ErrorContent.tsx`, `NotFoundContent.tsx` and `AppSidebar.tsx`. A new shell that renders its own top-level
  container needs it too, or the link is dead on that route; `SkipToContent.test.tsx` scans for the
  declaring files and fails when the set changes.
- **More than one guard protects the confirmation page.** The proxy redirects when `payment_intent` is
  absent, and `page.tsx` redirects again when it is absent or empty (`?payment_intent=` passes the proxy's
  `has()`). The page reads the query through `paymentConfirmationQuerySchema.validate`, because Next hands a
  repeated parameter over as an array, which `has()` passes too: a repeated `payment_intent` would reach Stripe as
  an array, and a repeated `activation` compares unequal to `failed` and would claim Premium is active. A query
  that fails the schema reads as empty, so it redirects home like a missing `payment_intent`, and the check is
  what narrows `payment_intent` to a string before `confirmation` runs.
- **A path beginning with two slashes reaches the proxy's redirect.** `config.matcher` excludes, beyond `/api`,
  `/_next` and `/_vercel`, only a **literal** dot, so `//1234567890/payment/confirmation` arrives, and a leading `/%2e`
  is stripped as a dot segment after the match, leaving the doubled slash behind; `new URL(homePath, request.url)`
  would read it as protocol-relative. The proxy assigns the target to `new URL(request.url).pathname` instead, and
  `src/middleware.test.ts` asserts the origin survives.
- **`api/health/route.ts` is public and unauthenticated**, and `.well-known/api-catalog` advertises it.
- **The proxy's Markdown rewrite trusts `config.matcher` to keep internal paths out.** The matcher
  excludes `/api` and every dotted path, so `/.well-known/*` and the other route handlers never reach the
  proxy at all; the rewrite branch has no guard of its own. Widening the matcher means adding one, which is
  what the `config matcher` block in `src/middleware.test.ts` is there to catch.
- **The planner page imports its sections through `next/dynamic`, and that does not keep them out of the first
  load.** A `dynamic()` import that is rendered on the server is fetched and run at hydration like any other
  chunk, so `CalendarList`, `Summary`, `Legend`, `Roadmap` and `Contact` are in the planner's first load in one
  chunk of about 20 KB compressed. What keeps the first load small is what those sections import: the
  `date-holidays` dataset and the PDF export's Effect runtime are imported when they are used, and each `dynamic()`
  modal is mounted only once it has been opened (`useHasOpened`).
