# 9. Next stays on 16.2 and TypeScript on 6, pinned by the Cloudflare adapter

Date: 2026-08-15

## Status

Accepted.

## Context

Next 16.3.0 landed in `81222a48` together with TypeScript 7, and from that commit onward every pull request
failed the same six tests in `e2e/[locale]/not-found.spec.ts`: an unknown path answered **500**, serving
Cloudflare's **Error 1101 (Worker threw exception)** page instead of the app's own 404. Nothing else on the
site was affected, and the failure never showed locally.

The asymmetry is the whole story. Every other page is fully prerendered and served from the incremental cache,
so on Cloudflare it executes no application code at all. `/_not-found` is the one page rendered at request
time, because `global-not-found.tsx` detects the locale through `headers()` and `cookies()` inside a
`<Suspense>` boundary. It is therefore the only page in a position to throw, and it did.

Four bisect pull requests narrowed it, each ruling one thing out: the tree from immediately before
`81222a48` runs the full suite green; `partialPrefetching: false` on its own does not help; reverting the
four dependency bumps that participate in rendering that page — `motion`, `@base-ui/react`, `next-intl`,
`lucide-react` — does not help; and Next 16.3.1 does not help either, so the fault spans 16.3.x rather than
being a single bad release. What remained was the Next bump itself, against
[`@opennextjs/cloudflare`](https://github.com/opennextjs/opennextjs-cloudflare) **1.20.2** — which is the
`latest` tag, has no beta or canary alongside it, and was published 2026-08-01, two days before 16.3.0
existed.

That left no version of the adapter that supports the Next the app was running, and three ways out. Patching
the adapter through `pnpm patch` was rejected because the actual exception has never been captured: no local
reproduction is possible (`cf:build` fails on the maintainer's Windows machine) and the Worker's stack trace
was never pulled from the tail consumer, so any patch would be a guess at a fault whose shape is unknown.
Making the 404 statically prerendered was rejected because it removes server-side locale detection from that
page, trading a real user-facing behaviour for a toolchain convenience. Deleting `global-not-found.tsx` so
the route-level `[locale]/not-found.tsx` takes over does not work at all: with no root layout in a
`[locale]`-only app, Next falls back to its built-in "This page could not be found".

TypeScript is dragged along because it cannot move independently. TypeScript 7 ships the Go compiler and no
`lib/typescript.js`, and Next's type-checking path loads exactly that file; only from 16.3 does `next build`
shell out to the project-local `tsc` instead. TypeScript 7 on Next 16.2 kills `pnpm build` before it
type-checks anything.

## Decision

Next is pinned to **16.2.12** and TypeScript to **6.0.3**, and they move as a pair, Next first. Neither is
raised until `@opennextjs/cloudflare` publishes a release that supports Next 16.3.

`partialPrefetching` stays out of `next.config.ts`: it is a 16.3 option and a config error on 16.2. The
`@typescript/typescript6` compatibility package is not a dependency, and `tests/docs-consistency.test.ts`
imports `typescript` directly for its compiler-API parsing — under TypeScript 7 that import has to become the
compatibility package, which is why the two versions travel together.

The rejected alternative worth naming is upgrading anyway and working around the crash in application code,
by making the 404 statically prerendered. It was rejected because the cost lands on users of a page the app
does not control the traffic to, in order to keep a toolchain version the app gains nothing else from.

## Consequences

- **The pin is load-bearing, and raising Next alone breaks the build while raising it with TypeScript breaks
  production.** A dependency bot proposing Next 16.3 is proposing to reintroduce a 500 on every unknown URL.
  The e2e suite catches it, but only after a preview deploy, so the pin should be read before the failure is
  re-diagnosed.
- **The repo stays on a TypeScript version behind the ecosystem.** Anything that requires 7 — its speed, and
  eventually its type-level features — is unavailable, and `next build` keeps type-checking through Next's
  compiler-API path rather than the project's own `tsc`.
- **`global-not-found.tsx` is why the failure is visible at all, and it must not be deleted as a fix.** With
  no root layout in a `[locale]`-only app, removing it hands 404s to Next's built-in page. Removing the
  `experimental.globalNotFound` flag is separately a no-op on 16.3, where the file's presence is what counts.
- **The exception itself is still unknown.** Closing this properly means capturing the Worker's stack trace —
  `wrangler tail` against a live preview, or the `forever-pto-tail` consumer's output — and reporting it
  upstream. Until then the diagnosis is "16.3.x breaks request-time rendering on 1.20.2", which is where the
  evidence stops.
- **`/[locale]/payment/confirmation` renders at request time too**, and escapes the e2e suite only because
  `middleware.ts` redirects it away when `payment_intent` is absent. It was never confirmed broken or
  healthy under 16.3; whoever revisits this pin should check it with a real payment intent first.
- Recorded in [`CLAUDE.md`](../apps/web/CLAUDE.md) under *Versions* and *Structure & aliases*.
