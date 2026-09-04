# apps/web/src/app

## Purpose

The Next.js App Router tree: every URL the app answers, plus the file-convention entry points Next.js
discovers by name ([`sitemap.ts`](./sitemap.ts), [`robots.ts`](./robots.ts), [`global-error.tsx`](./global-error.tsx), [`global-not-found.tsx`](./global-not-found.tsx), `favicon.ico`).

This folder is a thin shell. Pages compose components from `@ui/*`; route handlers parse the request,
run an Effect program from `@application/use-cases/*` against `ApplicationLayer`, and map the typed
failure channel onto a status code. Business logic that lands here is in the wrong layer.

## The tree

| Path | Role |
| --- | --- |
| `[locale]/layout.tsx` | **The root layout.** There is no layout file at the `src/app` root; this is the only file that renders `<html>`/`<body>` on the normal path |
| `[locale]/(app)/planner/` | The planner screen: sidebar chrome in `layout.tsx`, content in `page.tsx` |
| `[locale]/(app)/payment/confirmation/` | Post-Stripe landing page; reads `payment_intent` from the query string |
| `[locale]/(marketing)/` | Homepage (`page.tsx`) and its header/footer shell (`layout.tsx`) |
| `[locale]/(marketing)/legal/` | Privacy policy, cookie policy, terms of service, legal notice |
| `api/` | Seven route handlers; see below |
| `.well-known/[...slug]/` | Catch-all serving three static JSON documents |
| [`fonts.ts`](./fonts.ts) | The four `next/font/google` families, exported as CSS-variable handles |
| `sitemap.ts`, `robots.ts` | SEO file conventions |
| `global-error.tsx`, `global-not-found.tsx` | Last-resort boundaries that render their own document |

## How a request reaches a page

[`src/middleware.ts`](../middleware.ts) runs first, and its `config.matcher` decides what it sees: everything except `/api`,
`/_next`, `/_vercel` and any path containing a dot, plus `/api/markdown` explicitly. In order it:

1. Lets a direct `/api/markdown` request through, and **overwrites the path header** on the way; see below.
   The branch is not decoration: without it a direct hit carrying `Accept: text/markdown` would match the
   next rule and rewrite the route onto itself. This file used to say the branch existed "only to attach
   `Cache-Control` and `Vary: Accept`", which was both its least important effect and the one that turned out
   to be wrong.
2. Rewrites any request carrying `Accept: text/markdown` to `/api/markdown`, passing the pathname in an
   `x-markdown-path` **request header**, so every HTML URL has a Markdown twin without a second route
   existing. **The Markdown twin reads `SITE_ROUTES`, the same
   table the sitemap, `robots.txt` and every `generateMetadata` read**: it kept a second list of its own,
   with the `metadata.*` keys on it, so a route was one row here and another row there. `titleKey` and
   `descriptionKey` moved onto `SiteRoute`; adding a route is genuinely one row now.

   **The lookup is an exact match on the locale-stripped path, and that is load-bearing.** It was
   `pathname.includes(path)`, which once handed every unlisted path the homepage body: the four legal pages
   and the confirmation page all answered with the marketing copy under the homepage's title. Listing the
   routes fixed the symptom and left the mechanism: `/legal/privacy-policy-2024` still resolved *as* the
   privacy policy, and `/planner-comparison` as the planner. `routePathFromPathname` drops the locale segment
   and the comparison is `===`.

   **The claim that used to end this paragraph (that the homepage is "the empty path matched deliberately
   rather than whatever fell through") was false, and the test named after it asserted a different module.**
   The mis-resolution was fixed; the fallthrough never was. `buildMarkdownPage` ended with an unguarded
   homepage body, so *any* path `findRoute` did not know reached it, and the suite pinned exactly that: three
   cases asserting `/legal/privacy-policy-2024` and friends are served the homepage. Meanwhile the case
   called *"resolves the homepage by matching the empty path, not by falling through"* imported `findRoute`
   and never called `buildMarkdownPage` at all: it would have stayed green with the module deleted.

   `buildMarkdownPage` answers `null` for an unlisted path now, and [`api/markdown/route.ts`](./api/markdown/route.ts) turns that into a
   **404**. The two representations of one URL agreed on nothing before: `/does-not-exist` returned the
   app's own 404 page as HTML and the homepage's markdown at 200 to anything sending
   `Accept: text/markdown`, which tells a crawler or an agent that the page exists. The `Vary: Accept` header
   is on the 404 too, so a shared cache cannot serve one representation for the other. Verified by restoring
   the fallthrough and watching the affected cases go red.

   **That 404 was unreachable end to end until the header fix below, and this paragraph read as though it
   were live.** `buildMarkdownPage` did answer `null` and the route did turn it into a 404, but no request
   arriving through the rewrite ever asked it about an unlisted path, because the pathname never reached the
   handler at all. Curling `/totally-made-up-xyz` with `Accept: text/markdown` answered 200 with the homepage
   until both were fixed together. A unit test proving a branch and a request never reaching it are different
   claims; only the second one is the feature.
3. Redirects `**/payment/confirmation` to the locale home when `payment_intent` is absent.
4. Runs the `next-intl` middleware, which negotiates the locale and fills the `[locale]` segment.
5. Re-writes the `NEXT_LOCALE` cookie next-intl just set, through `setLocaleCookie`
   ([`src/infrastructure/i18n/cookie.ts`](../infrastructure/i18n/cookie.ts)), which applies `LOCALE_COOKIE_POLICY`: `secure`,
   `sameSite: 'lax'`, `path: '/'`. **It is the same object `routing.ts` gives next-intl**, which is the
   point: the client-side language switcher writes this cookie too, from `document.cookie`, and the two
   writers have to agree. This step used to say next-intl's own cookie "carries none of those", which was
   wrong about `secure` and `sameSite`, and it used to add `httpOnly`, which silently broke every soft
   locale switch. See [`src/infrastructure/CLAUDE.md`](../infrastructure/CLAUDE.md). [`middleware.test.ts`](../middleware.test.ts) guards the step under
   `describe('locale cookie policy')`; the policy itself is asserted in
   [`src/infrastructure/i18n/cookie.test.ts`](../infrastructure/i18n/cookie.test.ts).
6. Hands the response to the location proxy ([`src/infrastructure/proxy/location.ts`](../infrastructure/proxy/location.ts)), which sets the
   detected-country cookie.

Security headers are **not** set here. They are the `SECURITY_HEADERS` array in [`next.config.ts`](../../next.config.ts), applied
through `async headers()` on `source: '/(.*)'`, which, unlike this matcher, really does cover every request.

**The pathname travels in a header because a rewrite does not change what the handler reads from the URL.**
It used to be `/api/markdown?path=<pathname>`, and the query never arrived: inside a route handler
`request.url` is the URL the *visitor* asked for, not the rewrite target, so `searchParams.get('path')`
answered `null` and the route fell through to its `?? '/'` default. **Every Markdown twin served the
homepage**: `/planner`, `/es/planner` and all four legal pages answered 200 with the marketing copy under
the homepage's title. The unit suite could not see it, because `route.test.ts` called `GET` with a URL that
had the query on it, which is a fixture built from the same misreading as the code.

The same defect had a second half. Since the only `path` the handler could ever see was the visitor's own,
`/planner?path=/legal/terms-of-service` served the terms of service **under the planner's URL**, with
`Cache-Control: public, max-age=3600` on it. So the representation of a URL was decided by a query parameter
anyone could append.

Both halves close the same way: the proxy `set`s the header, which overwrites anything inbound, and the
direct-hit branch `set`s it to `NEUTRALISED_MARKDOWN_PATH`. The route reads *only* the header and 404s
unless `isProxiedMarkdownPath` accepts it, with no fallback to the query: the fallback is the
vulnerability, not a convenience. `middleware.test.ts` asserts both overwrites; `route.test.ts` asserts the
header wins over a disagreeing query and that neither an absent nor a neutralised header reaches the
builder. Verified by restoring the `??` fallback and watching the case fail.

**The direct-hit branch overwrites because deleting does not survive the adapter, and that is not a style
choice.** It called `headers.delete(MARKDOWN_PATH_HEADER)` for months. Next serialises
`NextResponse.next({ request: { headers } })` as `x-middleware-override-headers` plus one
`x-middleware-request-<key>` per header, and Next's own router applies it by *deleting* every original
header absent from that list. `@opennextjs/aws` does not: `dist/core/routing/middleware.js` ends on
`headers: { ...internalEvent.headers, ...reqHeaders }`, a merge, so a deleted header is simply not
overridden and the caller's value survives. On Cloudflare the guard therefore never ran, in either runtime —
the merge is the same code on the edge and Node.js middleware paths, so [ADR 0009](../../../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md) blamed the wrong
thing for this one. Overwriting is expressible in the mechanism that does exist, which is why the sentinel
lives in `twin.ts` beside the header name rather than being an empty string spelled twice. Only
[`markdown.spec.ts`](../../e2e/api/markdown.spec.ts) can catch a regression here: `middleware.test.ts` calls the exported function and reads
what was handed to `NextResponse.next`, so it sees the intent and never the runtime.

**[`markdown.spec.ts`](../../e2e/api/markdown.spec.ts) drives the twin the way a client does, and it is the only place the proxy,
the route and the header are proven to line up.** It used to request `/api/markdown` directly and assert
200, `text/markdown` and `public, max-age=3600`: the three things the route refuses on exactly that path,
so every case in it was red on every pull request and the `e2e` job with them. The sharp one asserted the
*defect*: `?path=/en/planner` expecting 200, which `route.test.ts` pins as a 404, so making the spec green
the obvious way would have put the query fallback back. It now requests the **page** route with
`Accept: text/markdown` and asserts what the twin produces on each branch, plus the two claims no unit test
can reach: a bare `GET /api/markdown` 404s, so the overwrite is live end to end, and
`/planner?path=/legal/terms-of-service` serves the planner. It imports `MARKDOWN_ACCEPT`,
`MARKDOWN_PATH_HEADER` and `MARKDOWN_ROUTE` from [`src/infrastructure/markdown/twin.ts`](../infrastructure/markdown/twin.ts) rather than repeating
the strings, because the spoofed-header case asserts a **404** and a stale header name would let it pass for
the wrong reason. The cache assertions are directional (the hit must not carry `no-store`, the miss must not
carry `max-age=3600`), so an intermediary appending a directive cannot turn the job red for nothing.

**One module states the cache policy, and it is the one that knows the outcome.**
[`src/infrastructure/markdown/twin.ts`](../infrastructure/markdown/twin.ts) owns `MARKDOWN_ROUTE`, `MARKDOWN_ACCEPT`, `MARKDOWN_PATH_HEADER` and
`markdownTwinHeaders({ found })`: content type, `Cache-Control` and `Vary` together. It was written in two
modules with three copies of `max-age=3600`, and the proxy's copy was applied *before*
`buildMarkdownPage` had run, so it could only ever be a guess about a page it had not looked up. The
measurable consequence: a 404 went out with `public, max-age=3600` on it, because the route set only `Vary`
on that branch and the proxy supplied the rest. A shared cache would answer "Not Found" for an hour to
everyone. A miss is `no-store` now, and the proxy states no cache policy at all.

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
URLs carry **no** `/en` prefix while the other five do. Anything building a URL must go through
`localePath` / `localeAlternates` in [`src/infrastructure/i18n/utils/url.ts`](../infrastructure/i18n/utils/url.ts) rather than concatenating the
locale itself.

`[locale]/layout.tsx` re-validates the segment with `hasLocale` and calls `notFound()`: the proxy is
not treated as the only gate, because a statically rendered path can arrive without it.

Every page and layout under `[locale]/` that reads translations **from the request locale** calls
`setRequestLocale(locale)` first. Skipping it there opts the segment out of static rendering; it is not
decoration. Five of the eleven files do not call it, and each has a reason rather than an oversight: the four
`legal/` pages pass the locale explicitly (`getTranslations({ locale, namespace })`), so they never read the
request-locale store and still prerender under the `generateStaticParams` declared in `[locale]/layout.tsx`;
`payment/confirmation/page.tsx` is the one deliberately dynamic page in the tree, so there is no static
render for it to opt out of. Copy the explicit-locale form or the `setRequestLocale` form, not neither.

## The two route groups

Groups do not affect the URL: `(app)` and `(marketing)` exist purely to give two different chromes.

**`(marketing)`** has a group-level `layout.tsx` (header, footer, toaster) and its own `error.tsx`. Its
pages are fully static: `page.tsx` declares `generateStaticParams`, and indexability comes off `SITE_ROUTES`
rather than out of the page: the homepage's row says indexable, every `legal/` row says it is not.

**`(app)`** has *no* group-level layout. The sidebar shell lives one level down in `planner/layout.tsx`,
so `payment/confirmation/` deliberately renders bare; a Stripe return should not come back into the
planner chrome. The confirmation route is the one dynamic page in the tree: it reads `searchParams`, runs
the `confirmation` Effect program and has a `loading.tsx` for the round trip.

**`planner/layout.tsx` mounts the app's only `SidebarProvider`, and [`AppSidebar.tsx`](../ui/modules/sidebar/AppSidebar.tsx) deliberately
mounts none.** It used to open a second one inside this one, so the tree carried two independent
`open`/`openMobile` states and two nested `div.flex.min-h-svh.w-full` wrappers. Every consumer that
happened to sit inside `AppSidebar` (`SidebarTrigger`, `Logo`, `ManagementBar` through the `SidebarInset`
children) resolved to the *inner* provider and so agreed with each other by render position alone, while
the outer provider's `openMobile` was state nothing could ever toggle. `StoresInitializer`, which sits
between the two, would have read the dead one. `AppSidebar` returns a fragment now and takes the context
from here; a consumer added between the provider and `Sidebar` reads the same sidebar as everything else.
`Sidebar.test.tsx` asserts the mount site is unique.

## Metadata

**A route that needs metadata declares it in its own `page.tsx`, in one line:**

```ts
export const generateMetadata = routeMetadata('/legal/privacy-policy');
```

There were seven sibling `metadata.ts` files, each three lines long (an import of `routeMetadata` and that
same export) plus seven `export { generateMetadata } from './metadata';` edges re-exporting them. The split
was there to make the metadata unit-testable on its own; once `routeMetadata` existed there was nothing
route-specific left in those files to test, and [`routeMetadata.test.ts`](../infrastructure/seo/routeMetadata.test.ts) covers the one behaviour they
had. `metadata.ts` is not a Next file convention (only `page.tsx` is read for `generateMetadata`), so the
separate file bought a second module and an indirection, and nothing else. Do not reintroduce one.

**The shape lives in one module; each file supplies only what its route knows.** `buildMetadata` under
`@infrastructure/seo` owns `metadataBase`, the `alternates` pair, `openGraph`, `twitter`, the `robots` block
and `other`. A route file resolves `siteUrl` through [`getPublicEnv.ts`](../infrastructure/services/env/getPublicEnv.ts), pulls its copy from a `metadata.*`
namespace, and passes strings: `title`, optional `description` and `keywords`, and a **required `route`**.
Three rules are derived rather than repeated: `openGraph` appears when there is a description, and
`images`/`twitter`/`keywords` only when the route is indexable, which is exactly what the seven files did
by hand.

**`indexable` used to be a parameter, and every one of the seven callers computed it the same single way.**
It is a pure function of the path, so `buildMetadata` calls `isIndexable(route)` itself and `SITE_ROUTES`
becomes the only thing that decides. Nothing can now pass `{ route: '/legal/privacy-policy', indexable: true }`,
because there is nothing to pass. Making `route` required closed the other half: it was optional, so a route
could omit it and get `canonical: localePath(locale, undefined)` (`'/'`), and the marketing page *did*,
carrying an unused `HOME_PATH` const while canonicalising through the fallback. It read correctly only
because the homepage's canonical happens to be `/`. The guide used to say "passing `path` is what prevents
it"; the type says it now.

The `keywords` gate is new in the code and old in this file: the rule was written here and the
implementation spread `...(keywords && { keywords })` ungated. It held only because no caller passed keywords
on a noindex route.

They were seven copies of one 43-line shape; the four `legal/` ones were identical bar a namespace and a
path repeated three times each. The translation call stays per-route on purpose: `getTranslations` types its
keys against the namespace, so resolving the strings at the call site is what keeps a typo in a message key a
compile error instead of a runtime blank. A new route that skips the `alternates` block ships six URLs
competing for the same ranking; the required `route` parameter is what prevents it.

## API route handlers

| Route | Method | What it does |
| --- | --- | --- |
| [`api/payment/route.ts`](./api/payment/route.ts) | POST | Creates a Stripe PaymentIntent for a Donation. Rate-limits on `cf-connecting-ip` before anything else |
| [`api/payment/activate/route.ts`](./api/payment/activate/route.ts) | GET | Stripe's `return_url`. Activates Premium and redirects to the confirmation page with the cookie already set; see *The redirect hand-off* below |
| [`api/webhooks/stripe/route.ts`](./api/webhooks/stripe/route.ts) | POST | Verifies the `stripe-signature` header, then hands the event to `processWebhookEvent`. Reads the **raw** body via `request.text()`; parsing it as JSON would break signature verification |
| [`api/check-session/route.ts`](./api/check-session/route.ts) | GET, POST | GET verifies the premium cookie; POST activates Premium from an email, optionally with a payment key, and sets the cookie. GET treats "did not verify" and "could not verify" differently: see *The GET half of check-session distinguishes two failures* below |
| [`api/contact/route.ts`](./api/contact/route.ts) | POST | Contact form submission |
| `api/markdown/route.ts` | GET | Renders the Markdown twin of a page via [`buildMarkdownPage.ts`](../infrastructure/markdown/buildMarkdownPage.ts). Only reached through the proxy rewrite, and now only *drivable* through it: the pathname comes from the `x-markdown-path` header, never the query string |
| [`api/health/route.ts`](./api/health/route.ts) | GET | Liveness probe. Answers `status` and `timestamp` and nothing else |

Shared conventions across them:

- The Effect program is run at the boundary (`Effect.runPromise(program.pipe(Effect.provide(ApplicationLayer)))`),
  and every tagged failure is caught into a `NextResponse`. `Effect.catchAll` closes the tail so a route
  never rejects.
- Error bodies use the `ApiError` constants from [`src/infrastructure/api/errors.ts`](../infrastructure/api/errors.ts), never a raw message,
  except `ValidationError` and `PromoCodeError` whose messages are already user-facing.
- A JSON body is read with `parseJsonBody` ([`api/parseJsonBody.ts`](../infrastructure/api/parseJsonBody.ts)) **inside** the Effect program, never with
  a bare `await request.json()` before it. A malformed, empty or non-object body then fails as a
  `ValidationError` carrying `invalid_body` and maps onto the same 400 as a schema violation; parsing outside
  the program rejects before any `catchTags` map exists and Next answers a bare 500. The Stripe webhook is
  the exception: it needs the raw text.
- Work that must not delay the response (persisting the payment record, sending the email) is returned by
  the use-case as a `deferred` Effect and run inside Next's `after()`.
- `check-session` and `health` respond through `noStore` ([`src/infrastructure/api/response.ts`](../infrastructure/api/response.ts)). Anything
  carrying Premium state must keep doing so. **Assert the header, and assert it against the real
  `noStore`.** [`check-session/route.test.ts`](./api/check-session/route.test.ts) mocked that module with a double that set
  `Cache-Control` itself and then checked only the body, so dropping the call from the route would have left
  the double unused and every case green: a test made vacuous by its fixture rather than its assertion. The
  mock is gone and all five branches assert `no-store`; verified by returning a bare `NextResponse.json` from
  the no-token branch and watching that one case, and only that one, go red.

## The GET half of check-session distinguishes two failures

`api/check-session`'s `GET` answers 200 with `{ premiumKey: null, email: null }` on a `SessionError` rather
than a status, because an expired token is a normal state and not a failure. That is true of *one* of the
conditions `verifySession` can hit. It was one branch for four: an expired token, a bad signature, a rotated
`JWT_SECRET` and an **absent** `JWT_SECRET`, the last because `getJWTSecret()` throws synchronously inside
the `Effect.tryPromise` thunk and Effect routes a sync throw through the same `catch`. So a variable dropped
from the environment logged every live session holder out, **deleted their cookie on the way**, and emitted
nothing. It is the same silence the *Failure used to be silent to the operator* paragraph below records for
`api/payment/activate`, and both WRITE transports were routed through `activatePremiumRequest` to fix it. The
READ transport was not, and it is the one that destroys the credential.

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
importing it should not pull `jose` and the signing path in behind it. Two policies follow from it:

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

**The `GET` now provides `ApplicationLayer`**, which it did not before, because the log line goes through the
`LoggerService` tag like every other route's. All four Live layers are `Layer.sync` and read no environment
at construction, so providing them costs a closure each.

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
four guards:

- **The client secret is required and verified, and that is now true of the *type*, not just of this
  route.** `activateWithPayment` takes `{ paymentIntentId, clientSecret }` with both required, and compares
  the secret against the retrieved intent's own `client_secret` through `matchesClientSecret`
  ([`src/infrastructure/services/premium/activation.ts`](../infrastructure/services/premium/activation.ts)), in constant time and length-first. Without it,
  anyone holding a leaked payment intent id could mint a session. The length check is not tidiness:
  `charCodeAt` past the end returns `NaN`, `NaN | 0` is `0`, so a length-blind loop accepts any prefix.

  This paragraph used to be a claim about the route rather than about the use-case. One function served
  both activation paths with `expectedEmail?` **and** `clientSecret?` optional, and its body read
  `if (clientSecret && !matchesClientSecret(...))`: omit the field and the guard did not run. Neither
  call site did omit it, but nothing said they could not, and half the use-case's own tests called it with
  no guard at all. It is two total entry points now, one per caller:
  [`activatePremium.ts`](../application/use-cases/activatePremium.ts) exports `activateWithPayment({ paymentIntentId, clientSecret })` for this route
  and `activateWithClaimedPayment({ paymentIntentId, expectedEmail })` for the `POST /api/check-session`
  recovery path, over one private implementation. **This is not a new exposure and does not close an old
  one**: [ADR 0008](../../../../adr/0008-premium-derived-from-payment.md) already accepts that the recovery path grants Premium to whoever types
  an address with a succeeded payment behind it. What changed is that the interface no longer implies
  otherwise.
- **`redirect_status` short-circuits.** Stripe says whether the redirect succeeded; if it did not, the
  handler never calls Stripe at all.
- **Rate-limited on `cf-connecting-ip`**, through the same `checkRateLimit` the payment route uses.
- **Never cached**, through an explicit `no-store` header on the redirect, because the response carries a
  `Set-Cookie`. It must **not** also declare `export const dynamic = 'force-dynamic'`: this app runs with
  `cacheComponents` enabled in `next.config.ts`, and Turbopack rejects that route segment config outright:
  `next build` fails with "Route segment config "dynamic" is not compatible with
  `nextConfig.cacheComponents`". The header is the whole mechanism.

**Failure used to be silent to the operator, and that was the worse half.** The whole program was
`checkRateLimit(ip).pipe(Effect.andThen(activateWithPayment), Effect.catchAll(() => Effect.succeed(null)))`,
so a rate limit, a replayed payment-intent id, a Stripe outage and a rotated `JWT_SECRET` all became the same
`null`, and the file imported no logger at all. A rotated secret meant every donor paid, was redirected, saw
`premiumActivationFailed`, and nothing anywhere emitted a line. Both transports now go through
`activatePremiumRequest` in [`@infrastructure/api/operations`](../infrastructure/api/CLAUDE.md), which owns
the deferred hand-off, the tag→status map and one log line per failure: `warn` for a refusal the payer
caused, `error` for Stripe, the session and the database. The route keeps only what is its own: the redirect,
the cookie and the `no-store` header.

Failure is never silent and never a lie: the handler redirects with `activation=failed` and the page then
renders `premiumActivationFailed`: the payer is told their money went through and their access did not,
instead of the page claiming Premium is active. That claim was unconditional once, on a page that activated
nothing, which is the bug this route exists to close.

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

`.well-known/[...slug]/route.ts` is a lookup table, not a router: it joins the slug segments and matches
against three exact keys (`api-catalog`, `mcp/server-card.json`, `agent-skills/index.json`), delegating
to [`apiCatalog.ts`](../infrastructure/well-known/apiCatalog.ts), [`mcpServerCard.ts`](../infrastructure/well-known/mcpServerCard.ts) and [`agentSkillsIndex.ts`](../infrastructure/well-known/agentSkillsIndex.ts) in `@infrastructure/well-known`. Anything
else is a 404. Add a document by adding a key; do not branch inside the handler.

**That table is a `Map` again, and the route no longer carries the guard for it.** As a plain object it
answered `/.well-known/constructor` (and `toString`, `valueOf`, `hasOwnProperty`) with an inherited
`Object.prototype` function, which passed the `if (!handler)` guard and was then called as a handler, so the
route returned 500 where it owed 404. A `Map` has no prototype chain to walk into.

It had drifted back to a `Record<string, WellKnownDocument>` while this paragraph still insisted it must not,
and behaviour stayed correct only because the *route* had grown its own `Object.hasOwn` check. That put the
safety **above** the interface: [`documents.ts`](../infrastructure/well-known/documents.ts) exported an indexable object typed `Record<string, …>`, and
with `noUncheckedIndexedAccess` off a second consumer indexing it directly would get a non-optional
`WellKnownDocument` from the compiler and reinstate the bug with no warning.

`lookupWellKnownDocument(slug)` is the only way in now, and `wellKnownSlugs()` is what the agent-skills test
enumerates. Nothing indexable leaves the module. Verified by swapping the `Map` back for an object literal:
four prototype-key cases go red.

These paths contain a dot, so the proxy matcher excludes them; they never see locale negotiation.

**The skills index advertises only what this handler serves, and that is now one list rather than a rule.**
`agentSkillsIndex.ts` used to give all five entries a `url` under `/.well-known/agent-skills/<name>/SKILL.md`
and a `sha256`: every one of those URLs 404s, because the handler matches three exact keys and none of them
is a `SKILL.md`, and every digest was `e3b0c442…`, the SHA-256 of the empty string. The two entries
describing a document that does exist now point at it; the three describing a *behaviour* carry no `url` at
all, and nothing carries a digest, because none of these is a file whose bytes could be hashed.

The fix for the join was a sentence ("adding an entry with a URL means adding the key here first"), and it
is a value now: [`well-known/slugs.ts`](../infrastructure/well-known/slugs.ts) holds the three slugs and `wellKnownUrl`, `well-known/documents.ts`
maps each slug to its content type and builder, the route builds its lookup from that map, and the index
interpolates the same constants. [`agentSkillsIndex.test.ts`](../infrastructure/well-known/agentSkillsIndex.test.ts) asserts every advertised URL resolves to a served
key, verified by pointing one at `api-catalogue` and watching it fail.

**The three document modules return plain objects; the route owns the envelope.** Each used to build its own
`NextResponse.json(...)` with its own `Content-Type` and the shared `Cache-Control`, so a fourth document
meant remembering both headers and every test had to `await res.json()` to reach a value the module had
computed synchronously.

**Both branches state a cache policy, and for a while only the hit did.** The 200 carried
`WELL_KNOWN_CACHE_CONTROL` (`public, max-age=86400`) and the 404 carried no `Cache-Control` at all, which is
not the same as carrying `no-store`: a 404 is heuristically cacheable under RFC 9111, and this one offers no
`Last-Modified` to bound the guess, so a shared cache or a browser is entitled to invent a lifetime for it.
The set of served slugs changes on deploy and nowhere else, so the answer that gets remembered is exactly the
one a new document has to overturn. `slugs.ts` declares the pair together, `WELL_KNOWN_CACHE_CONTROL` beside
`WELL_KNOWN_MISSING_CACHE_CONTROL`, so the two branches are one decision.

This is the same defect the Markdown twin had, in the same shape, two sections above: a hit with an explicit
policy and a miss with an implicit one. That one was found because a stale header was measurably wrong; this
one was invisible because the absent header looks like nothing rather than like a value. **Not declaring a
policy is not declaring "no"**, and a route with a cacheable happy path has to answer the question on every
branch.

## Error and not-found boundaries

| File | Catches |
| --- | --- |
| `[locale]/(marketing)/error.tsx` | Errors in marketing pages. Renders inside the marketing layout, so it emits bare content: header and footer are already there |
| `[locale]/error.tsx` | Everything else under `[locale]/`, including the whole `(app)` group, which has no boundary of its own. Wraps its content in a full-height shell because there is no chrome around it |
| `global-error.tsx` | Failures of the root layout itself. React has unmounted the layout, so this file renders its own `<html>`/`<body>` and re-applies the font variables |
| `[locale]/not-found.tsx` | `notFound()` raised inside a matched locale segment |
| `global-not-found.tsx` | URLs that match no route at all, so no layout ran. Enabled by `experimental.globalNotFound` in `next.config.ts`; it re-detects the locale itself from the `x-next-intl-locale` header, then the locale cookie, then `Accept-Language` |

`global-error.tsx` bundles **only** [`en.json`](../ui/i18n/messages/en.json) and hard-codes `lang="en"` on the document. That is
deliberate: pulling all six catalogues into the root bundle would cost every route roughly 500 KB for a
page most users never see. Do not "fix" the mismatch between the URL locale and the rendered language by
importing the other five.

## Cloudflare request context

`getCloudflareContext()` may be read here and in server actions, never in a use-case; see
[ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md). In this folder the only direct readers are
`api/markdown/route.ts` and `.well-known/[...slug]/route.ts`. `api/contact/route.ts` reaches it through
[`getRequestPublicEnv.ts`](../infrastructure/services/env/getRequestPublicEnv.ts), the per-request reader it shares with the contact server action; `sitemap.ts`,
`robots.ts` and `routeMetadata` reach it through `getPublicEnv.ts`, the cached one.

The `{ async: true }` form is not interchangeable with the bare call, but the split is not request versus
no-request. Only the async form works where there may be no request, so everything evaluable outside one
(`sitemap.ts`, `robots.ts`, the `.well-known` handler, `getPublicEnv.ts` under `'use cache'`) must use it.
The reverse does not hold: `api/markdown/route.ts` uses the async form and only ever runs inside a GET,
because the async form is always safe. `api/contact/route.ts` uses the sync one. Copying a *sync* call into
a prerendered path is the failure mode to watch for; copying an async one costs nothing.

Config is read off the context and passed down as plain values; use-cases receive `{ siteUrl, contactEmail }`
rather than reaching for the environment themselves.

## SEO files

**One table says which routes exist, which are public, and what each is called.** `SITE_ROUTES` under
`@infrastructure/seo` carries a `path`, an `indexable` flag, the sitemap hints and the `metadata.*` message
keys, and five readers derive from it: `sitemap.ts` emits the cross-product of the six locales and
`indexableRoutes()`, `robots.ts` disallows every locale-expanded `privateRoutes()` path, `buildMetadata`
resolves `isIndexable(route)` for itself, `buildMarkdownPage` looks the title and description up through
`findRoute`, and `routeMetadata` builds the whole `generateMetadata` from the row.

**Adding a route is one row and one line.** It used to be one row, one 27-line `metadata.ts` and one 63-line
`metadata.test.ts`, seven times over: the four `legal/` pairs differed from each other on exactly two lines
each. A route file is now:

```ts
export const generateMetadata = routeMetadata('/legal/privacy-policy');
```

`routeMetadata` takes a `RoutePath`, the literal union of the table's own `path` values, so a typo is a
compile error rather than a silent fallthrough. `routeFor` is what makes the lookup total where `findRoute`
cannot be: it indexes a record derived from `SITE_ROUTES` and keyed by that same union, so it returns a row
rather than `row | undefined`. The one cast in [`routes.ts`](../infrastructure/seo/routes.ts) is where that record is built, and it is safe
because the table is the only source of both its keys and its values.

**The per-route tests could not fail for the reason they existed.** Each mocked `getTranslations` as
`(key) => \`t:${key}\`` (discarding the namespace), so the privacy policy's own metadata module could have
read `metadata.termsOfService` and stayed green, and the namespace was the only thing those files decided for
themselves. Everything else they asserted was `buildMetadata` behaviour, which [`buildMetadata.test.ts`](../infrastructure/seo/buildMetadata.test.ts) owns.

Their replacement had to avoid the opposite trap, and the first draft did not: asserting
`title === t(route.titleKey)` in a loop over `SITE_ROUTES` reads the row on both sides, so swapping one
route's keys for another's keeps it green; verified by doing exactly that. What catches it is a property the
table alone can violate (**no two routes share a `titleKey`**) plus a genuinely second source (**every key
resolves to a real message in `en.json`**). Both were confirmed by breaking them.

It is declared `as const satisfies readonly SiteRoute[]` rather than annotated `SiteRoute[]`, and that is not
style: the literal `titleKey` types are what let `createTranslator`'s `t()` reject a typo in a message key at
compile time. Widening them to `string` compiles and fails at runtime with a blank heading.

That used to be three edits in three files (a `ROUTES` entry, a `DISALLOWED_PAGES` prefix, and
`robots: { index: false }`) with nothing tying them together. It also closed a hole: `DISALLOWED_PAGES`
blocked the prefixes `/legal/` and `/payment/`, so a private route anywhere else was disallowed by nobody.
`isIndexable` **fails closed** (a path with no row is treated as private), so the failure mode of forgetting
the table is a page missing from the sitemap, not a private page advertised to crawlers. [`routes.test.ts`](../infrastructure/seo/routes.test.ts)
pins that, and [`robots.test.ts`](./robots.test.ts) additionally pins that nothing the sitemap advertises is disallowed.

Both files resolve the base URL from the Cloudflare env rather than a constant. Only `sitemap.ts` gets the
host it is actually served from, though: `robots.ts` is prerendered, so it bakes whatever the build resolved;
see the Deploy section of the root [`CLAUDE.md`](../../../../CLAUDE.md).

## Structured data

[`src/ui/modules/shared/seo/JsonLd.tsx`](../ui/modules/shared/seo/JsonLd.tsx) exports two components, mounted on different pages on purpose.
`JsonLd` carries the `WebApplication` and `Organization` schemas and sits on `/planner`; `FaqJsonLd` carries
the `FAQPage` schema and sits on the homepage, **because that is the page that renders the FAQ**. Search
engines expect the marked-up questions to be visible on the page carrying the markup, and the FAQ schema was
emitted on the planner, which has no FAQ on it at all.

The Premium offer states a `priceSpecification` with a `minPrice`, not a fixed price. Premium is unlocked by
a Donation the payer chooses ([`src/application/dto/payment/schema.ts`](../application/dto/payment/schema.ts) accepts 1 to 10000), so the fixed
4.99 it used to advertise was simply untrue. `MINIMUM_DONATION` reads `AMOUNT_MIN` out of that schema now, so
the two cannot drift; this sentence used to ask the reader to move them together by hand.

## Fonts

`fonts.ts` declares Bricolage Grotesque, Space Grotesk, Instrument Serif and JetBrains Mono, each with a
`--font-*` CSS variable and `display: 'swap'`. Import the handles and spread `.variable` onto `<body>`;
three files do this (`[locale]/layout.tsx`, `global-error.tsx` and `global-not-found.tsx`), and a new
document-rendering file must do it too or it will render in the fallback stack. The variables are consumed
by the Tailwind theme in `@styles`, never by class names in this folder.

## Testing

Every route file has a co-located test: `.test.ts` for handlers, `sitemap.ts` and `robots.ts`, `.test.tsx`
for pages, layouts and error boundaries. `loading.tsx` and `fonts.ts` are the exceptions: neither has
behaviour worth asserting. Metadata is not tested here at all: it is one `routeMetadata(path)` call per page
now, and `routeMetadata.test.ts` owns the behaviour; see *Metadata* above for why the per-route tests went.

Handler tests mock the infrastructure module rather than the Effect layer where it is cheaper to do so
([`api/health/route.test.ts`](./api/health/route.test.ts) stubs `@infrastructure/api/response`), and reach for `vi.stubEnv` when a route
reads the environment. Keep the `await import('./route')` after the mocks: route modules read their
dependencies at module scope, so a top-level import would bind the real ones.

## Gotchas

**`GET /api/health` served `{"body":{…}}` for as long as `noStore` was positional, and its own test could
not see it.** The route has always passed `noStore({ body: { status, timestamp } })`. While the declaration
read `noStore(body, init?)`, `body: object` accepted that wrapper whole and the endpoint answered the nested
shape. [`health/route.test.ts`](./api/health/route.test.ts) mocked `@infrastructure/api/response` with a
double that already destructured `{ body, init }`, so it asserted the shape the double produced rather than
the shape the route produces: the same vacuous-fixture pattern this guide records for `check-session`. The
mock is gone and the real `noStore` runs, which is what makes the three body assertions able to fail.

- **Every route shell owes the skip link a landmark.** `[locale]/layout.tsx` renders `SkipToContent` on
  every page, and its `href` is built from `MAIN_CONTENT_ID` in
  [`../ui/modules/layout/SkipToContent.tsx`](../ui/modules/layout/SkipToContent.tsx). Six shells carry that
  id: `[locale]/(marketing)/page.tsx`, `[locale]/(marketing)/legal/layout.tsx`,
  `[locale]/(app)/payment/confirmation/page.tsx`, and, through the modules they compose,
  `ErrorContent.tsx`, `NotFoundContent.tsx` and `AppSidebar.tsx`. A new shell that renders its own top-level
  container needs it too, or the link is dead on that route; `SkipToContent.test.tsx` scans for the
  declaring files and fails when the set changes.
- **Two guards protect the confirmation page.** The proxy redirects when `payment_intent` is missing
  *and* `page.tsx` redirects again. Removing either leaves the Effect program running with `undefined`.
- **That redirect sets `pathname` on a parsed URL; it must never resolve a path as a relative reference.**
  The target is the request path with `/payment/confirmation` sliced off, and it was built as
  `new URL(homePath, request.url)`. A pathname beginning with two slashes is *protocol-relative*, so that
  expression returns a different origin entirely, and `config.matcher` does not stop one arriving, because
  its only exclusion beyond `/api` and `/_next` is a **literal** dot: `//1234567890/payment/confirmation`
  carries none, and a leading `/%2e` is stripped as a dot segment after the match, leaving the doubled slash
  behind. A visitor following a `/payment/` link on this domain was answered `307` to whatever host the path
  spelled. `homePath` is now forced to a single leading slash and assigned to `new URL(request.url).pathname`,
  which cannot change the origin whatever it contains. `src/middleware.test.ts` asserts the origin survives.
- **`api/health/route.ts` is public and unauthenticated**, and `.well-known/api-catalog` advertises it, so
  the body says the app is up and nothing else. Do not add configuration to it: not which secrets are set,
  not the `NODE_ENV`, not a dependency check that names a host.
- **The proxy's Markdown rewrite trusts `config.matcher` to keep internal paths out.** The matcher
  excludes `/api` and every dotted path, so `/.well-known/*` and the other route handlers never reach the
  proxy at all; the rewrite branch has no guard of its own. Widening the matcher means adding one back,
  which is what the `config matcher` block in `src/middleware.test.ts` is there to catch.
- **The planner page imports its sections through `next/dynamic`.** That is a bundle-size decision, not an
  accident; a static import of `CalendarList` or `Summary` pulls the whole planning UI into the first load.
