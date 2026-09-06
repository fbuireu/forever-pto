# 15. Cache Components stay off on the Workers runtime

Date: 2026-09-05

## Status

Accepted.

## Context

Production logged, several times a day and always in the same shape, a Next warning followed by three
runtime errors:

```
Next.js cannot guarantee that Cache Components will run as expected due to the current runtime's
implementation of `setTimeout()`.
Error: The Workers runtime canceled this request because it detected that your Worker's code had hung
and would never generate a response.
```

The preview end-to-end suite showed the same thing as a `page.goto` that never returned on the 404 route,
across every locale and both attempts of a run, while a sibling pull request's preview passed the same specs
minutes earlier. Intermittent in production, deterministic on a fresh Worker.

It reproduced locally on workerd, with `wrangler dev --local` over a `pnpm cf:build` of `main`, with
BetterStack logging disabled so the logger could not be the cause: `/fr` and `/es` answered 500 after five
seconds with three "code had hung" errors each, and `/de/<unknown>` and `/<unknown>` never answered at all.
Three errors per request matched the three `'use cache'` sites the home page reaches (`getPublicEnv`,
`getCurrentYear`, `Testimonials`), and the warning is Next's `createAtomicTimerGroup` finding no `_idleStart`
on workerd's timers, which are numbers rather than Node `Timeout` objects. The warning itself is benign; the
hang is in how Cache Components run their per-request prerender on that runtime, and the intermittence in
production is the `cacheLife('days')` entries being warm most of the time.

Two experiments settled it. Keeping `cacheComponents` on and taking only `getCloudflareContext` out of the
cached function did not build: `generateMetadata` then reads a dynamic value during prerender and Next
refuses. Turning `cacheComponents` off, with `partialPrefetching` (which requires it) and the three
`'use cache'` directives, built, and every route answered on workerd in under a second with zero errors:
`/`, `/fr`, `/es` 200, the three 404 paths 404 in about a hundred milliseconds.

What the flag was buying: partial prerendering of the `[locale]` pages (a static shell with three cached
holes revalidated daily), `partialPrefetching`, and a per-fragment cache for three values that are
deploy-time constants or a translated static section. Without it the same pages are plain SSG through
`generateStaticParams`, built once per deploy, which is what those values were anyway.

## Decision

`cacheComponents` is `false` in [`next.config.ts`](../apps/web/next.config.ts) and `partialPrefetching` is
gone from it. No file carries a `'use cache'` directive: `getPublicEnv` reads the Cloudflare context in its
async form and returns, `getCurrentYear` returns the year, `Testimonials` is an ordinary server component.
[`sitemap.ts`](../apps/web/src/app/sitemap.ts) declares `export const dynamic = "force-dynamic"`, which the
flag used to forbid and which the sitemap needs so that a preview names its own host rather than the one
baked at build time. `vitest.setup.ts` no longer stubs `next/cache`, since nothing imports it.

The rejected alternative is keeping the flag and hunting the hang inside Next or OpenNext. It may well be
fixable there, and the day either ships a fix this ADR can be superseded; until then a feature that hangs
requests in production is not worth three cached constants.

## Consequences

- **The `[locale]` pages are fully static per deploy.** The footer year and the public env they render are
  the build's. Both were already the build's on every prerendered shell, as the *Deploy* section of
  [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md) explains; nothing observable changed for a visitor.
- **`sitemap.ts` is server-rendered on demand**, so it reads the Worker's runtime `NEXT_PUBLIC_SITE_URL` and
  the preview suite's host assertion keeps holding. `robots.txt` stays static, as it was.
- **Route segment config is allowed again**, and `apps/web/src/app/CLAUDE.md` no longer has to warn that
  `export const dynamic` fails the build. The activate route still relies on its `no-store` header alone.
- **Re-enabling the flag is a decision, not a cleanup.** It has to come with the reproduction above run
  green on workerd: `pnpm cf:build`, `wrangler dev --local`, the seven paths in the experiment, zero
  "code had hung" errors.
- Where this bites: [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md), the env section of
  [`apps/web/src/infrastructure/CLAUDE.md`](../apps/web/src/infrastructure/CLAUDE.md), and the docs site's
  caching page.
