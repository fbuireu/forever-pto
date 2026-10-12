# 24. Unknown URLs answer from a catch-all under the locale, and the global 404 is static

Date: 2026-10-12

## Status

Accepted. Changes what [ADR 0009](./0009-next-16-2-pinned-by-the-cloudflare-adapter.md) rejected: a statically
prerendered 404 was ruled out there because it lost the server-side locale detection, and the locale now comes from
the URL, through the route that matches it, so nothing is detected. ADR 0009 says so in its own *Status*.

## Context

The root layout is `apps/web/src/app/[locale]/layout.tsx`; there is no layout at the root of `app/`. Next has two answers for a URL nothing serves. A segment's `not-found.tsx` renders only when
`notFound()` is thrown inside that segment, and [`global-not-found.tsx`](../../apps/web/src/app/global-not-found.tsx)
renders for a URL no route matches, with no layout, no params and no props, so it cannot know a locale.

Nothing under `[locale]` threw for an unknown path, so every unknown URL reached `global-not-found.tsx`, and that page
guessed: the `x-next-intl-locale` header the proxy sets, then the locale cookie, then `Accept-Language`. The guess made
`/_not-found` the one page rendered at request time, tied it to an internal header that the Node.js middleware path
never forwards (ADR 0009's last amendment), served `<html lang="en">` in every language and corrected it with an
inline script, and gave no 404 a `<title>`. A path with a dot never reaches the proxy, so `/missing.txt` matched
`[locale]` with `missing.txt` as the locale, the root layout threw `notFound()` with nothing above it, and Next
answered with its bare error document.

The alternatives:

- **Keep the guess.** It needs the request, so the page stays dynamic and depends on a header the proxy may not hand
  over, and the server HTML keeps the wrong `lang`.
- **Delete `global-not-found.tsx`.** With the root layout inside `[locale]`, Next then answers an unmatched URL with
  its built-in page.
- **A catch-all under `[locale]` that throws.** The URL already names the locale; a route that matches it and calls
  `notFound()` from inside `[locale]` gets that segment's `not-found.tsx`, inside its layouts, in its language.

Measured on this Next and React, a `notFound()` thrown by a page is drawn by the browser. React renders no error
boundary on the server, so the page's error fails the shell of the render, and Next answers 404 with its own error
document (`<html id="__next_error__">`, the `noindex` meta and the flight data); the browser renders the not-found
boundary from that data. A two-file app with a root layout at the root of `app/` and a `blog/not-found.js` answers the
same way, so it is the framework's behaviour rather than this tree's. A localised 404 whose whole document leaves the
server would need the proxy to set the status: `NextResponse.rewrite(url, { status: 404 })` renders the target page
with that status under `next start`, and `@opennextjs/aws` carries a rewrite's status to the response
(`rewriteStatusCode`). It also needs a proxy that knows every route, and a dotted path under a locale (`/es/x.txt`)
never reaches it.

## Decision

Every unknown URL a locale claims is answered by a catch-all under `[locale]`, and the global 404 is a static page in
the default language.

1. **`app/[locale]/layout.tsx` is the root layout.** Its `generateStaticParams` returns `LOCALES`, it is the only
   `generateStaticParams` under `app/`, and it exports `dynamicParams = false`, so a first segment that is not a locale
   answers 404 at the router on every prerendered route, before any layout runs. It narrows the segment through
   `resolveLocale` instead of throwing: the only route that can still hand it a word no locale claims is the
   catch-all, which `/api/x` and `/foo/bar.txt` reach without the proxy, and a `notFound()` thrown by the root layout
   has no boundary above it. The `(marketing)` layout narrows the same way.
2. **`app/[locale]/(marketing)/[...rest]/page.tsx` only calls `notFound()`.** `(marketing)` is the group whose layout
   draws the shell, so the 404 renders inside the header and footer. It is `[...rest]`, because `[[...rest]]` would
   collide with the group's own `page.tsx`, and it is the one catch-all under `[locale]`. Its `generateMetadata` is
   `notFoundMetadata`, the title `metadata.notFound.title` in the segment's locale, because a `not-found.tsx` cannot
   export metadata.
3. **`app/[locale]/(marketing)/not-found.tsx` renders the 404 view in the request's locale**, read through
   `getLocale()`. The view, `NotFoundContent`, carries the content alone; whoever needs the chrome draws it.
   `[locale]` keeps no `not-found` file of its own: no page outside `(marketing)` calls `notFound()`.
4. **`app/global-not-found.tsx` is the fallback for a URL no locale claims, and it is static.** It renders
   `<html lang>` from `routing.defaultLocale`, imports the global stylesheet and the font class, draws the header, the
   view, the footer and the quick start inside its own `NextIntlClientProvider` with the default locale's messages and
   the theme and motion providers, passes that locale to every translation call, pins the request locale to it with
   `setRequestLocale` so the header and footer read it without a header, and titles itself from the messages. It reads
   no `headers()`, no `cookies()` and no `x-next-intl-locale`.

| URL | Answer |
| --- | --- |
| `/es/x`, `/de/a/b/c`, `/es/x.txt` | 404 from the catch-all, in that locale, inside the shell |
| `/en/x` | 307 to `/x` |
| `/x`, `/xx/x` | The proxy rewrites to `/en/…`; 404 from the catch-all, in English |
| `/missing.txt` | 404 from `global-not-found.tsx`, in English, prerendered |
| `/api/x`, `/foo/bar.txt` | 404 from the catch-all, in English, since both layouts narrow the segment |

The rejected alternatives are the guess and the deletion, for the reasons above, and the proxy-set status: it would
put the whole document on the server for a proxied path, at the cost of a proxy that holds the route table and a
second answer for the dotted paths it never sees.

## Consequences

- **A localised 404's server HTML is Next's error document.** The status is 404 and the `noindex` meta is there; the
  `lang`, the title, the view and the shell reach the page when its script runs, from the flight data. A client
  without JavaScript sees an empty page, and a crawler sees a 404 marked `noindex`. Only a URL no locale claims, such
  as `/missing.txt`, gets a document rendered whole on the server.
- **`/_not-found` is static (`○` in the build), and the catch-all is the page rendered at request time**
  (`ƒ /[locale]/[...rest]`). The request-time render ADR 0009's Worker failure was about now runs there, and the
  preview's `e2e` run is what covers it on Workers.
- **`dynamicParams = false` makes a cache miss a 404 on the Worker.** Next answers a miss on a route whose fallback is
  `false` with its 404, so every page serves only while the adapter reads the prerendered entries under the keys Next
  asks for. A first push of this decision met an adapter that did not, and every page answered 404 until the
  production smoke run rolled it back; ADR 0009's amendment of the same date has the mechanism and the adapter
  version that fixed it. A Next or adapter bump that breaks the pairing again shows on the preview's `e2e` run, and
  `next start` cannot show it.
- **`dynamicParams` exists only while Cache Components stay off**
  ([ADR 0015](./0015-cache-components-stay-off-on-the-workers-runtime.md)); turning them on removes it and with it the
  router's 404 for a first segment that is not a locale.
- **Every page of `(marketing)` carries the 404 view in its flight data**, because Next renders a segment's
  `not-found.tsx` with every page under it; a page of `(app)` carries none.
- A page outside `(marketing)` that starts calling `notFound()` needs a `not-found.tsx` beside it, or Next draws its
  built-in 404 inside the root layout.
- [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) holds the three rules: one catch-all under
  `[locale]` that only calls `notFound()`, `dynamicParams = false` on the root layout with no other
  `generateStaticParams` under `app/`, and no request read in `global-not-found.tsx`. They are in the enforced list of
  [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md), and the folder guide that carries the URL table is
  [`apps/web/src/app/AGENTS.md`](../../apps/web/src/app/AGENTS.md). The end-to-end cases are
  `apps/web/e2e/[locale]/(marketing)/not-found.spec.ts` and `apps/web/e2e/global-not-found.spec.ts`.
