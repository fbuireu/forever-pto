# 9. Next stays on 16.2 and TypeScript on 6, pinned by the Cloudflare adapter

Date: 2026-08-15

## Status

Accepted. **Amended 2026-08-29: the pin is lifted.** Next is 16.3.3, `@opennextjs/cloudflare` is 1.20.3,
wrangler is 4.126.0 and TypeScript is 7.0.2 at the root and in `apps/web`. The amendment is the last section
of this file, and it says plainly which of the two conditions below was met and which was not.

## Context

Next 16.3.0 landed in `81222a48` together with TypeScript 7, and from that commit onward every pull request
failed the same six tests in `e2e/[locale]/not-found.spec.ts`: an unknown path answered **500**, serving
Cloudflare's **Error 1101 (Worker threw exception)** page instead of the app's own 404. Nothing else on the
site was affected, and the failure never showed locally.

The asymmetry is the whole story. Every other page is fully prerendered and served from the incremental cache,
so on Cloudflare it executes no application code at all. `/_not-found` is the one page rendered at request
time, because [`global-not-found.tsx`](../apps/web/src/app/global-not-found.tsx) detects the locale through `headers()` and `cookies()` inside a
`<Suspense>` boundary. It is therefore the only page in a position to throw, and it did.

Four bisect pull requests narrowed it, each ruling one thing out: the tree from immediately before
`81222a48` runs the full suite green; `partialPrefetching: false` on its own does not help; reverting the
four dependency bumps that participate in rendering that page (`motion`, `@base-ui/react`, `next-intl`,
`lucide-react`) does not help; and Next 16.3.1 does not help either, so the fault survives at least one patch
release rather than being a single bad build. What remained was the Next bump itself, against
[`@opennextjs/cloudflare`](https://github.com/opennextjs/opennextjs-cloudflare) **1.20.2**, which is the
`latest` tag and has no beta or canary alongside it.

**The registry dates, checked 2026-08-24.** 1.20.2 was published 2026-07-21; `next@16.3.0` on 2026-08-03,
thirteen days later; `16.3.1` on 2026-08-13; `16.3.2` on 2026-08-21, and it is `latest`. This ADR first said
two days, which understated how far behind the adapter is and made the gap read like a release-timing
accident rather than a version the adapter has never been built against.

**Only 16.3.0 and 16.3.1 were ever put on a preview.** "The fault spans 16.3.x" therefore generalises from
two releases to an open-ended range, and 16.3.2 is the untested member Renovate proposes next. Treat the pin
as covering it, and treat a green run on 16.3.2 as evidence rather than as proof the pin was wrong: the
failure needs a preview deploy to appear at all.

That left no version of the adapter that *works with* the Next the app was running, whatever the peer range says, and three ways out. Patching
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

Next is pinned to **16.2.12** and TypeScript to **6.0.3**, and they move as a pair, Next first.

**What lifts the pin is evidence, not an adapter release.** An earlier version of this ADR waited for
`@opennextjs/cloudflare` to "publish a release that supports Next 16.3", and that condition can never be met,
because it is already claimed. 1.20.2's peer range on `next` is `>=15.5.21 <16 || >=16.2.11`, which admits
every 16.3 release, and upstream's own documentation says Next 16 is supported. No future release will carry
the signal, so waiting for one is waiting forever while the evidence that matters goes uncollected.

The pin lifts on either of these, and both are things somebody does rather than waits for:

1. **The exception is captured and explained.** Pull the Worker stack trace for a request-time render on a
   preview, from `wrangler tail` or the `forever-pto-tail` consumer, and either land the fix upstream or
   patch against a fault whose shape is known. This is the one that closes the question rather than deferring
   it, and it is the last Consequence below.
2. **A preview on the candidate Next version runs the `e2e` suite green**, `e2e/[locale]/not-found.spec.ts`
   included. That is a per-version result and not a general clearance: a green 16.3.2 says nothing about
   16.3.3, so record the version the run covered alongside the bump.

Until one of them happens, a bump is reverted on the pin, not re-diagnosed.

`partialPrefetching` stays out of [`next.config.ts`](../apps/web/next.config.ts): it is a 16.3 option and a config error on 16.2. The
`@typescript/typescript6` compatibility package is not a dependency, and [`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts)
imports `typescript` directly for its compiler-API parsing, and under TypeScript 7 that import has to become the
compatibility package, which is why the two versions travel together.

The rejected alternative worth naming is upgrading anyway and working around the crash in application code,
by making the 404 statically prerendered. It was rejected because the cost lands on users of a page the app
does not control the traffic to, in order to keep a toolchain version the app gains nothing else from.

## Consequences

- **The pin is load-bearing, and raising Next alone breaks the build while raising it with TypeScript breaks
  production.** A dependency bot proposing Next 16.3 is proposing to reintroduce a 500 on every unknown URL.
  The e2e suite catches it, but only after a preview deploy, so the pin should be read before the failure is
  re-diagnosed.
- **The adapter's peer range is not a compatibility statement, and reading it as one is how this pin gets
  quietly lifted.** `>=15.5.21 <16 || >=16.2.11` admits the exact versions that fail. A satisfied peer range
  means nothing here; a green `e2e` run on a preview means something.
- **The repo stays on a TypeScript version behind the ecosystem.** Anything that requires 7, its speed and
  eventually its type-level features, is unavailable, and `next build` keeps type-checking through Next's
  compiler-API path rather than the project's own `tsc`.
- **`global-not-found.tsx` is why the failure is visible at all, and it must not be deleted as a fix.** With
  no root layout in a `[locale]`-only app, removing it hands 404s to Next's built-in page. Removing the
  `experimental.globalNotFound` flag is separately a no-op on 16.3, where the file's presence is what counts.
- **The exception itself is still unknown.** Closing this properly means capturing the Worker's stack trace
  (`wrangler tail` against a live preview, or the `forever-pto-tail` consumer's output) and reporting it

  upstream. Until then the diagnosis is "16.3.x breaks request-time rendering on 1.20.2", which is where the
  evidence stops.
- **`/[locale]/payment/confirmation` renders at request time too**, and escapes the e2e suite only because
  [`middleware.ts`](../apps/web/src/middleware.ts) redirects it away when `payment_intent` is absent. It was never confirmed broken or
  healthy under 16.3; whoever revisits this pin should check it with a real payment intent first.
- Recorded in [`CLAUDE.md`](../apps/web/CLAUDE.md) under *Versions* and *Structure & aliases*.

## Amendment, 2026-08-29: what moved and what is still unverified

**The adapter changed its mind about 16.2, which is the evidence this ADR did not have.** The Decision above
rejects "wait for an adapter release" on the grounds that 1.20.2's peer range already admitted every 16.3, so
no future release could carry a signal. That reasoning held for a range that *admits*. It does not hold for
one that *requires*: `@opennextjs/cloudflare` **1.20.3**, published 2026-08-26, moved its `next` peer to
`>=15.5.24 <16 || >=16.3.3`, dropping 16.2 from the 16 line entirely, and 1.20.4 the next day kept it. An
adapter that no longer supports the version this app was pinned to is a different fact from an adapter whose
range happens to include the version it was never built against.

**What was verified locally, on this branch:** `pnpm typecheck` clean across all three projects, the unit
suite at 2063 tests and the contract suite at 129, and `pnpm build` producing a full Next 16.3.3 production
build with `partialPrefetching` and `cacheComponents` both on.

**What was not verified, and it is the bar this ADR set:** condition 2, a green `e2e` run against a preview
on the candidate version, including `e2e/[locale]/not-found.spec.ts`. The preview deploy cannot authenticate
until `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` reach the four `web-*`/`docs-*` environments, which
is recorded in [`CLAUDE.md`](../CLAUDE.md) as the one outstanding settings item. Condition 1, the captured
Worker stack trace, was not attempted either: the exception is still unknown, and if 16.3.3 with 1.20.3
renders `/_not-found` correctly it will stay unknown. The fault itself is no longer in doubt, per the
paragraph above; what is unverified is whether **this** pair clears it. **So this bump is staged on evidence
about the adapter, not on evidence about the fix**, and the first preview run on this branch is what settles
it. If that run
shows Error 1101 again, revert to 16.2.12 with 1.20.2 and restore this pin rather than re-diagnosing.

**The fault stopped being theoretical while this was being written, and `main` is where it is running.**
Renovate auto-merged [#350](https://github.com/fbuireu/forever-pto/pull/350) on 2026-08-22, taking `next` to
**16.3.1** against adapter **1.20.2**, the exact pair this ADR forbids. It merged because `E2E tests` is not
a required check and 1.20.2's peer range admits 16.3, so nothing in the pull request objected. `main` has
carried it since — `6614da61`, the 1.8.3 release commit — and it is the last deploy production has had.
`https://forever-pto.com` answers **Cloudflare Error 1101** to a browser today, checked 2026-08-29 at 10:45
UTC.

That is worth stating precisely, because it cuts both ways. It **confirms** the fault: the pair fails in a
real Worker, on a real zone, not only in a preview, and the ADR's central claim needs no further defence. It
says **nothing** about 16.3.3 with 1.20.3, which is a different adapter built against a different Next; the
unverified condition below is still unverified. And it exposes what the pin was actually worth: a version
constraint in a manifest stops nobody when a bot with automerge rights can raise it, which is why making
`E2E tests` required is not a nicety but the missing half of this decision.

Nothing here rolls production back. That is `wrangler rollback --env production`, or this branch merging,
and neither belongs in an ADR.

**The production net that did not exist when this was written.** `ci.yml` now runs a smoke suite against
`https://forever-pto.com` after every production deploy, and one of its `@smoke` cases is the 404 route,
which is the page this fault appears on. A failure there fails the run, withholds the `web-v*` tag and runs
`wrangler rollback --env production`. That is a second line, not a replacement for the preview run: it
catches the fault after users could have seen it, where `e2e` catches it before.

**TypeScript moved with Next, but only two thirds of the way.** `astro check` refuses to run under
TypeScript 7 and says so itself: the native compiler exposes no programmatic API for the Astro language
server to load. So `apps/docs` stays on 6.0.3 while the root and `apps/web` take 7.0.2, and
[`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) asserts exactly that shape. The
compiler-API import in that suite is `@typescript/typescript6` now, as this ADR anticipated.

**Two pnpm-workspace `overrides` came off with the pin.** `postcss` and `sharp` were lifted there only
because `next@16.2.12` resolved versions carrying advisories; 16.3.3 vendors fixed ones, so the overrides are
deleted and Dependency Review stops failing for a consequence of this ADR rather than for the diff.

**The supply-chain policy dictated the adapter version, not preference.** `minimumReleaseAge` is 3 days and
1.20.4 was published 2026-08-27, so it is not installable yet; 1.20.3 matured on 2026-08-29T11:07Z. The
lockfile carries 1.20.3 for that reason alone, and Renovate, stricter at 4 days, will propose 1.20.4 when it
is old enough.
