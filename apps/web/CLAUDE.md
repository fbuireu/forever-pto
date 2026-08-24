# apps/web

## What this is

**forever-pto**: a planner that turns a fixed budget of paid days off into the longest possible stretches
away from work. The user picks a Country, an optional Region, a year and a PTO budget; the planner finds the
Bridges that turn that budget into the longest stretches off, and reports how well it did.

**The whole planner runs in the browser**: the server holds payment and contact records and nothing else
([ADR 0001](../../adr/0001-planner-runs-in-the-browser.md)). The server side is seven API route handlers
(`check-session`, `contact`, `health`, `markdown`, `payment`, `payment/activate` and the Stripe webhook at
`webhooks/stripe`), a `.well-known` catch-all, [`middleware.ts`](./src/middleware.ts), and some static rendering.

Premium (advanced metrics, manual editing of a Suggestion) is unlocked by a Donation. There are no accounts:
the payment record *is* the entitlement ([ADR 0008](../../adr/0008-premium-derived-from-payment.md)).

The vocabulary is the repo glossary's; see [`CONTEXT.md`](../../CONTEXT.md).

## Stack

- **Next.js 16** App Router + **React 19**, `next-intl` for i18n over six locales (en, es, ca, it, de, fr)
- **Zustand** stores for all client state, persisted to local storage through an obfuscating wrapper
  ([ADR 0007](../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md))
- **Effect 3** on every server path that talks to Stripe, Turso or Resend: typed error channel, dependencies
  injected as service tags ([ADR 0002](../../adr/0002-effect-for-external-service-boundaries.md))
- **Temporal** via `temporal-polyfill`, never the global
  ([ADR 0005](../../adr/0005-temporal-polyfill.md))
- **Tailwind CSS v4** + shadcn/ui; **Turso** via `@tursodatabase/serverless`: hand-written SQL, no ORM;
  **Stripe**; **Resend**; **BetterStack**
- **Cloudflare Workers** via `@opennextjs/cloudflare`, R2 for the incremental cache, the platform's own
  rate-limiting binding for the payment limiter
  ([ADR 0004](../../adr/0004-cloudflare-workers-as-deployment-target.md))
- **Biome** (lint + format), **Vitest** (unit, `happy-dom`), **Playwright** (e2e)

## Commands

These run inside this package. Every one of them also has a passthrough at the repo root, which is what the
repository guide documents; use whichever fits where you are.

```bash
pnpm dev                # next dev --turbopack
pnpm build              # next build
pnpm preview            # opennextjs-cloudflare build && preview (real Workers runtime)
pnpm deploy             # cf:build && opennextjs-cloudflare deploy
pnpm cf:typegen         # regenerate cloudflare-env.d.ts from wrangler.toml (reference only)

pnpm lint:all           # biome lint over this package
pnpm typecheck  # tsc --noEmit

pnpm test:ut            # vitest run
pnpm test:ut:coverage      # vitest run --coverage
pnpm test:e2e           # playwright, against BASE_URL (see below)
```

**`pnpm test:e2e` needs `BASE_URL`, and [`playwright.config.ts`](./playwright.config.ts) has no `webServer` to fall back on.** With the
variable unset, `use.baseURL` becomes `http://localhost:3000` and the run silently tests whatever is
answering on that port, or reports connection errors that read like application failures. Set it to a
deployed preview, which is what CI does: `ci.yml` passes the same URL to the `e2e` job's `BASE_URL` as
[`_deploy-web.yml`](../../.github/workflows/_deploy-web.yml) passes to `--var NEXT_PUBLIC_SITE_URL`, so `e2e/sitemap.spec.ts` can assert that the
sitemap names the host it is served from. A preview also needs `CF_ACCESS_CLIENT_ID` and
`CF_ACCESS_CLIENT_SECRET`, which the config turns into request headers.

```bash
BASE_URL=https://pr-123-forever-pto-development.fbuireu.workers.dev pnpm test:e2e
```

A `webServer` was considered and rejected rather than forgotten. This suite exists to exercise the Workers
runtime, so `next dev` is the wrong local target and `pnpm preview` is the right one; a `webServer` would
only ever run when `BASE_URL` is unset, and `cf:build` fails on the maintainer's Windows machine
([ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md) records the same limitation blocking a local reproduction), so on the one machine that would
reach it, it would fail. Revisit the day `cf:build` runs there.

**The `e2e/` suite has no case that renders an error boundary, and no longer pretends otherwise.**
A spec of its own under `e2e/[locale]/` plus six copies of a `[data-testid="error-boundary"]`
`not.toBeAttached()` assertion asserted the absence of a selector nothing in the suite ever makes
present, so renaming the `data-testid` on
[`src/ui/modules/pages/error/ErrorContent.tsx`](./src/ui/modules/pages/error/ErrorContent.tsx) would have left every one of them green.
They were deleted; the pages they sat on already assert a 200 and their own content, which is what a
thrown server component would break. Reinstating the check means first finding a URL that provokes a
boundary. `/payment/confirmation?payment_intent=<unknown>` is not one: `confirmation` in
[`src/infrastructure/services/payments/confirmation.ts`](./src/infrastructure/services/payments/confirmation.ts) types its error channel `never` and returns `null`, so the
page renders its own failure card.

Env: copy [`.env.example`](./.env.example). Local Worker secrets go in `.dev.vars`. The typed surface the build uses is
[`environment.d.ts`](./environment.d.ts) and nothing else; it hand-declares both `ProcessEnv` and the global `CloudflareEnv` the
Cloudflare context is read through, and it is tracked.

**Nothing type-checks the names inside it.** `skipLibCheck: true` plus the `.d.ts` extension means
`pnpm typecheck` never looks at a single identifier there, so an unbound one sits in a type the whole build
trusts. `Formats: typeof getRequestConfig` did, for as long as it took someone to run
`tsc --skipLibCheck false` over the file by hand: the identifier was never imported, and the augmentation was
dead besides, because the `getRequestConfig` callback in [`src/infrastructure/i18n/config.ts`](./src/infrastructure/i18n/config.ts)
returns no `formats` and every formatter call site passes its options inline.
`tests/docs-consistency.test.ts` compiles the file on its own now, with `skipLibCheck` off, and fails on any
`Cannot find name`. It leaves the imports unresolved on purpose, so the check stays local to this file: an
unresolved module still binds the names imported from it, and only a genuinely undeclared identifier surfaces.

`pnpm cf:typegen` writes wrangler's own inference to `cloudflare-env.d.ts` in this folder. It is reference
material, not part of the program: read it when adding a binding, then widen `environment.d.ts` by hand. Two
lines keep it that way and both are load-bearing: [`.gitignore`](../../.gitignore) so it never gets committed, and an explicit
`cloudflare-env.d.ts` entry in [`tsconfig.json`](./tsconfig.json)'s `exclude`, because `include` is `**/*.ts` and would
otherwise pull a package-root `.d.ts` straight into the program.

Letting it in does not fail the way you would expect. It declares `CloudflareEnv` a second time, with `[vars]`
typed as string literals where `environment.d.ts` says `string`, but `skipLibCheck: true` means those two
declarations are never compared; that clash only surfaces with `skipLibCheck: false`. What actually breaks is
the other 14,000 lines: the workerd runtime globals replace `lib.dom`'s `Response`, and roughly fifty call
sites start reporting `'body' is of type 'unknown'`.

## Structure & aliases

```
src/
  middleware.ts       # locale + country cookies, markdown rewrite; skips /api/* except /api/markdown
  app/                # App Router: [locale]/(app|marketing) pages, api/ route handlers, sitemap, robots
  application/        # use-cases, DTOs, Zustand stores, export, email templates. Orchestration, no I/O clients
  domain/             # calendar/ (pure planning engine) and payment/ (Effect programs)
  infrastructure/     # everything outbound: clients, services, workers, proxy, api operations, seo route table
  ui/                 # adapters, hooks, i18n, modules (components), styles, assets
e2e/                  # Playwright specs
workers/tail/         # the tail consumer Worker, with its own wrangler.toml
public/               # static assets
```

Path aliases (`tsconfig.json` `compilerOptions.paths`): `src/*`, `@app/*`, `@application/*`, `@domain/*`,
`@infrastructure/*`, `@ui/*`, `@assets/*` (→ [`src/ui/assets`](./src/ui/assets)), `@styles/*` (→ [`src/ui/styles`](./src/ui/styles)), `@i18n/*`
(→ [`src/ui/i18n`](./src/ui/i18n)). Prefer aliases over relative paths for cross-layer imports; keep same-folder imports
relative. There is no `baseUrl`, so every target resolves against this `tsconfig.json`; the aliases needed
no edit when the package moved. [`vitest.config.ts`](./vitest.config.ts) sets `resolve.tsconfigPaths`, so a new alias needs exactly
one edit, in `tsconfig.json`.

**Backticked paths in this guide and the ones below it are package-relative.** [`src/domain/calendar/types.ts`](./src/domain/calendar/types.ts)
means `apps/web/src/domain/calendar/types.ts`; the contract suite matches source-file citations by suffix, so
both forms resolve.

**Next owns [`next-env.d.ts`](./next-env.d.ts) outright, and it flaps.** A production build points its route import at
`.next/types/`, a dev run at `.next/dev/types/`, so the file shows as modified depending on which ran
last. It is generated and says so; leave whichever version is committed alone rather than committing the
flip back and forth.

**`next build` fills in `tsconfig.json`, so two settings there are not redundant.** It rewrites the file on
every run and writes its own default for any key that is absent: `strict: false` and `allowJs: true`. Both
land at the *next build* rather than at the deletion site, so deleting either as noise turns strict mode off,
or lets JavaScript into a TypeScript-only codebase, a long way from the change.
`tests/docs-consistency.test.ts` asserts both, asserts that this `tsconfig.json` stays beside the
[`next.config.ts`](./next.config.ts) that rewrites it, and asserts that `cloudflare-env.d.ts` stays excluded and ignored.

**TypeScript stays on 6 and Next stays on 16.2, and the pair is one decision, forced by Cloudflare.** Next 16.3
crashes the deployed Worker on any route rendered at request time: `@opennextjs/cloudflare` 1.20.2 is the
latest adapter and shipped 2026-08-01, two days before 16.3.0 existed, and there is no newer version or beta.
The symptom is the 404 page answering with Cloudflare **Error 1101 (Worker threw exception)** instead of
itself, which is what `e2e/[locale]/not-found.spec.ts` catches. `/_not-found` is the only page that renders
per request; everything else is prerendered and served from cache, so nothing else shows it.
[ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md).

TypeScript is pinned to 6 because it cannot move without Next moving first. TypeScript 7 ships the Go compiler
and no `lib/typescript.js`, and Next's type-checking path loads exactly that file; only from 16.3 does
`next build` shell out to the project-local `tsc` instead. So raising TypeScript to 7 while Next is 16.2 kills
`pnpm build` before it type-checks anything. Raise Next first, and only once the adapter supports it.

Two things follow that are easy to trip over. `partialPrefetching` in `next.config.ts` is a 16.3 option and is
a config error on 16.2; it must stay out while Next is pinned. And
[`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) imports `typescript` directly for its
compiler-API parsing; under TypeScript 7 that import has to become `@typescript/typescript6`, Microsoft's
compatibility package pinning the 6.x API, so the two move together too. The pin now appears in three
manifests (this one, the repo root and [`apps/docs`](../docs)), and only this one is load-bearing for `next build`.
`tests/docs-consistency.test.ts` asserts the three stay equal **and stay exact**, on the same reasoning as
the `wrangler` rule beside it: Renovate opens a pull request per manifest, so without the rule the first bump
desynchronises them silently. Equality alone was not enough: a `rangeStrategy` flip writes `^6.0.3` into all
three at once, which is equal and no longer a pin, so each version has to match three dotted numbers too.

Unit tests are co-located with the code they cover (`src/**/*.test.ts`, `.test.tsx` for components).

**Nested guides**. Read the one for the folder you are touching; they carry the detail this file omits:

| Folder | Covers |
| --- | --- |
| [`./src/app/CLAUDE.md`](./src/app/CLAUDE.md) | Route groups, the `[locale]` segment, API route handlers, metadata |
| [`./src/application/CLAUDE.md`](./src/application/CLAUDE.md) | Layer contract: what orchestration may touch |
| [`./src/application/dto/CLAUDE.md`](./src/application/dto/CLAUDE.md) | The DTO mapping convention, one folder per concept |
| [`./src/application/stores/CLAUDE.md`](./src/application/stores/CLAUDE.md) | The five Zustand stores, persistence, rehydration |
| [`./src/application/use-cases/CLAUDE.md`](./src/application/use-cases/CLAUDE.md) | Effect entry points and how they terminate |
| [`./src/domain/CLAUDE.md`](./src/domain/CLAUDE.md) | Layer contract: the two bounded contexts and their different rules |
| [`./src/domain/calendar/CLAUDE.md`](./src/domain/calendar/CLAUDE.md) | The planning engine: bridges, strategies, metrics, the cache protocol |
| [`./src/domain/payment/CLAUDE.md`](./src/domain/payment/CLAUDE.md) | Payment events, factory and handlers |
| [`./src/infrastructure/CLAUDE.md`](./src/infrastructure/CLAUDE.md) | Layer contract: the only layer that reaches outward |
| [`./src/infrastructure/api/CLAUDE.md`](./src/infrastructure/api/CLAUDE.md) | Failure → HTTP status mapping |
| [`./src/infrastructure/clients/CLAUDE.md`](./src/infrastructure/clients/CLAUDE.md) | Effect service tags for db, email, logging, payments |
| [`./src/infrastructure/services/holidays/CLAUDE.md`](./src/infrastructure/services/holidays/CLAUDE.md) | Holiday lookup and normalisation |
| [`./src/infrastructure/services/location/CLAUDE.md`](./src/infrastructure/services/location/CLAUDE.md) | Country detection strategies |
| [`./src/infrastructure/services/payments/CLAUDE.md`](./src/infrastructure/services/payments/CLAUDE.md) | Stripe provider, repository, promo codes |
| [`./src/infrastructure/workers/CLAUDE.md`](./src/infrastructure/workers/CLAUDE.md) | The calculations Web Worker and its message contract |
| [`./src/ui/CLAUDE.md`](./src/ui/CLAUDE.md) | Layer contract: adapters, hooks, modules, styles |
| [`./src/ui/i18n/CLAUDE.md`](./src/ui/i18n/CLAUDE.md) | Message bundles, namespaces, adding a locale |
| [`./src/ui/modules/CLAUDE.md`](./src/ui/modules/CLAUDE.md) | How component folders are organised |
| [`./src/ui/modules/core/CLAUDE.md`](./src/ui/modules/core/CLAUDE.md) | Primitives and the animation layer |
| [`./src/ui/modules/pages/planner/CLAUDE.md`](./src/ui/modules/pages/planner/CLAUDE.md) | The planner screen: calendar, holidays, summary |
| [`./src/ui/styles/CLAUDE.md`](./src/ui/styles/CLAUDE.md) | Layer order, tokens, what Biome does not format |

## Conventions

- **No explanatory comments in TypeScript sources under `src/`.** The folder's `CLAUDE.md` carries the
  explanation instead: a magic constant, a deliberate deviation, an ordering that looks wrong but is not, all
  belong in that folder's *Invariants* or *Gotchas* section, not above the line. A comment is invisible to
  everyone who is not already reading that file and nothing checks it against the code; a guide is read before
  the folder is touched, and `tests/docs-consistency.test.ts` does check it. Directives (`'use client'`,
  `'use server'`, `'use cache'`) are strings, not comments, and are unaffected. Two things are **not**
  explanatory comments and stay: a `biome-ignore` suppression, which changes what the linter does and must
  carry its reason on the same line; and the do-not-edit banner on generated output
  ([`src/ui/modules/bones/registry.ts`](./src/ui/modules/bones/registry.ts)). A suppression counts in either form, including the
  `{/* biome-ignore … */}` shape JSX forces. The rule is asserted wherever a comment sits: opening a line,
  trailing code, or inside JSX.
- **Two or more parameters means one named object, typed `SomeFunctionParams`.** `formatDate` takes
  `FormatDateParams`, `matchesClientSecret` takes `MatchesClientSecretParams`, `noStore` takes
  `NoStoreParams`. Exactly one parameter is passed directly, with no wrapper and no interface:
  `createHolidaySet(holidays)`, `amountFormatter(locale)`. The point is that the *order* of arguments stops
  being load-bearing: two adjacent positionals of the same type is the classic silent defect, and this
  codebase has got `isBefore` and `differenceInDays` backwards before.

  **Count every parameter, including the optional ones.** `noStore(body, init?)` is two, so it takes
  `NoStoreParams` with `init` optional inside the object, and a caller writes
  `noStore({ body: { premiumKey, email } })`. That nesting is correct: the payload is the value of `body`.
  The same goes for `createRichLink(href, options?)`, `track(event, properties?)` and
  `collateByLabel(options, locale?)`. The threshold is the parameter list's length, not how many of them the
  caller must supply.

  This guide stated the opposite for a while, as "count the *required* parameters, an optional tail does not
  count", and several functions were converted back to positional on the strength of it. That reading came
  from a correction about one call site's double wrapping and was generalised the wrong way.
  `GET /api/health` is what it cost: the route already passed `noStore({ body: { status, timestamp } })`,
  `body: object` accepts anything, so it typechecked and the endpoint served
  `{"body":{"status":"ok","timestamp":…}}` for as long as the declaration stayed positional.

  Two places do not follow the rule and cannot. `GET(request, context)` under `src/app/` is Next's own
  route-handler signature, and `compareByEfficiency({ a, b })` is called from `.sort()`/`.toSorted()`, which
  invoke a comparator with two positional arguments, so its two call sites wrap it rather than the function
  bending to a runtime contract it does not own.
- **No ALL-CAPS in translation strings.** Uppercasing is a presentation choice; do it with a CSS class in the
  component, so the six bundles stay comparable and other scripts are not mangled.
  `tests/docs-consistency.test.ts` scans all six for it now, against a named acronym allow-list; the same
  bullet in [`./src/ui/i18n/CLAUDE.md`](./src/ui/i18n/CLAUDE.md) says what the two keys that shouted were and
  why whole-token matching is what keeps `iOS` out of the report.
- **`typeof window`/`typeof document` guards stay.** They look redundant to a linter but are required under
  SSR: the bare identifier throws `ReferenceError` on the server.
- **Cross-layer imports use the alias, same-folder imports stay relative.** Mixed forms of the same module
  break Biome's import sorting.

## Gotchas

- **The calculation caches are cleared by the pipeline, not the engine and no longer by each caller.**
  [`cache.ts`](./src/domain/calendar/utils/cache.ts) memoises the holiday set under one fixed key and never evicts it, so a second run silently reuses
  the first run's holidays. `runPlanningPipeline` clears both on entry; a generator still must not.
  [ADR 0006](../../adr/0006-caller-owned-calculation-caches.md), amended 2026-08-14.
- **`Temporal` comes from `temporal-polyfill`, never the global.** The global does not resolve in the deployed
  Workers runtime, and a local run proves nothing. Do not let a codemod "modernise" the import.
  [ADR 0005](../../adr/0005-temporal-polyfill.md).
- **Persisted store state is obfuscated, not encrypted.** XOR + base64 with a key shipped in the bundle. Never
  call it encryption and never put anything confidential behind it.
  [ADR 0007](../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md).
- **The "I already donated" path is unverified, and Premium is never revoked.** v1 ships with no accounts and
  no user authentication, so the recovery path grants Premium to anyone who types an address with a succeeded
  payment behind it, and there is no revocation path for a donor. Both follow from the decision, not from an
  oversight; do not "harden" either in passing. There *is* a session layer: the entitlement travels in a
  signed HTTP-only cookie.
  [ADR 0008](../../adr/0008-premium-derived-from-payment.md).
- **The two bounded contexts under [`src/domain/`](./src/domain) follow different rules.** `calendar/` is pure because it runs
  in a Web Worker; `payment/` composes Effect against infrastructure tags. Neither is lint-enforced.
  [ADR 0003](../../adr/0003-pure-calendar-domain-effectful-payment-domain.md).
- **Logging is the one external call that does not go through Effect.** BetterStack has both a service tag and
  a plain singleton, and the singleton is what the stores, lookups and components use.
  [ADR 0002](../../adr/0002-effect-for-external-service-boundaries.md).
- **The Cloudflare context is request-scoped.** Route handlers and server actions may read it; use-cases may
  not, and must receive configuration as plain values.
  [ADR 0004](../../adr/0004-cloudflare-workers-as-deployment-target.md).
- **The planning pipeline exists once, and used to exist twice.** `runPlanningPipeline` under
  [`src/domain/calendar/`](./src/domain/calendar) is the whole run: caches, pseudo-Holidays, budget, both planning calls, the Metrics.
  The Web Worker and the holidays store's own action are its two callers and add only transport. They were two
  copies held together by mirrored test blocks, they drifted, and the symptom was one Planning Window
  producing two different plans depending on which path ran. Do not reintroduce orchestration at a caller.
  See [`./src/application/stores/CLAUDE.md`](./src/application/stores/CLAUDE.md).
- **The package version is load-bearing at runtime, not just at release time.** Seven source files import
  [`package.json`](./package.json) and read `version` to render the footer, the hero, the error page, the `/api/markdown` output
  and the `.well-known` agent-skills index. The docs site reads it too.

## Deploy

Cloudflare Workers via wrangler ([`wrangler.toml`](./wrangler.toml)): `.open-next/worker.js` as the entrypoint,
`.open-next/assets` served through the `ASSETS` binding, an R2 bucket for the incremental cache, a
`PAYMENT_RATE_LIMITER` `[[ratelimits]]` binding for the payment limiter, smart placement, and a
`forever-pto-tail` tail consumer, which is its own Worker under [`workers/tail/`](./workers/tail) and is deployed by the `deploy-tail`
job when the files its bundle is built from change. Only `env.production` binds a
route (`forever-pto.com/*`); `env.development` supplies the preview bindings and CI deploys one worker per PR
from it: `pr-<number>-forever-pto-development.fbuireu.workers.dev`, deleted when the PR closes.

**The tail Worker is gated on what its bundle is built from, which is wider than `workers/tail/`.**
[`workers/tail/index.ts`](./workers/tail/index.ts) imports the log-level contract out of
[`src/infrastructure/clients/logging/better-stack/contract.ts`](./src/infrastructure/clients/logging/better-stack/contract.ts), so `TAIL_PATHS` in `ci.yml` has to watch that
client too. While it named only `apps/web/workers/tail/`, editing the contract redeployed the app and left the
Worker on the previous bundled copy, and [`workers/tail/index.test.ts`](./workers/tail/index.test.ts) reads the *source* module, so
nothing in the suite could see the split. `tests/docs-consistency.test.ts` walks that import graph
**transitively** against the filter now, because whatever the contract itself imports is bundled too, and it
asserts at least one resolved path lands outside `workers/tail/`: `index.test.ts` imports `./index`, so a walk
that crossed no folder boundary at all still looked like a successful one.

**The tail Worker checks the ingest response and retains its own invocation logs, because it is the one
Worker whose whole job is telling you what happened.** Its `tail()` handler used to `await fetch(...)` and
discard the result: a 401 from a rotated or absent `BETTER_STACK_SOURCE_TOKEN`, or any 5xx, resolved to a
`Response` nobody read, so logging stopped and nothing said so. That is the failure shape
[`src/app/CLAUDE.md`](./src/app/CLAUDE.md) spends two paragraphs on for `api/payment/activate`, reproduced in
the observability path. It now reports a non-`ok` status and a thrown `fetch` through its own
`console.error`, which the Workers runtime captures only because `workers/tail/wrangler.toml` declares
`[observability]` with `invocation_logs` and no sampling; without that block there was no second place to
look. The two `console.error` calls carry a `biome-ignore` each, on the same reasoning as the BetterStack
client's: the log sink has nothing else to call. `workers/tail/index.test.ts` covers the rejected batch, the
unreachable host and the silence on success.

**`BETTER_STACK_INGESTING_URL` reaches the tail Worker from the same GitHub variable the app build reads,
and is no longer written in `workers/tail/wrangler.toml`.** The file hardcoded the host in `[vars]` while
`_deploy-web.yml` read `vars.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` for the app, so changing the BetterStack
source, which reissues the host and not only the token, updated the app on the next deploy and left the tail
Worker posting to a dead endpoint. `deploy-tail` was already reading
`vars.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` for the token, so the split was per value rather than per
Worker; the deploy step now passes `--var BETTER_STACK_INGESTING_URL:<host>` the way `_deploy-web.yml`
overrides `NEXT_PUBLIC_SITE_URL`, and fails loudly when the variable is unset. A hand-run
`wrangler deploy` from `workers/tail/` therefore leaves the host unbound, which the handler reports rather
than swallowing; pass the same `--var` when you deploy it by hand.

Every path in `wrangler.toml` is relative to the file itself, so the deploy runs with this package as the
working directory. Build config lives in `next.config.ts` and [`open-next.config.ts`](./open-next.config.ts).

**Wrangler inherits configuration into a named environment but never a binding, so the three `[[ratelimits]]`
blocks are not duplication.** `[assets]` and `[placement]` are declared once at the top
level and every environment gets them, which is the pattern `apps/docs/CLAUDE.md` teaches, but `vars`,
`ratelimits`, `r2_buckets` and `tail_consumers` are bindings: an environment that does not declare one does
not have it. Deleting `[[env.production.ratelimits]]` as a copy of the top-level block is the most ordinary
tidy-up in the file, and it makes `env.PAYMENT_RATE_LIMITER` `undefined` in production. The limiter fails
open **by design for errors** (`Effect.catchAll` turns a throwing `.limit()` into "not limited"), which is
right for a flaky binding and catastrophic for a missing one: `POST /api/payment` and `POST /api/check-session`
go unbounded in front of Stripe, silently. `tests/docs-consistency.test.ts` asserts every binding name
`environment.d.ts` declares is present in all three environments, and that the rate limiter is bounded
identically in each. It also asserts each named environment declares every binding **kind** the top level
declares: `CloudflareEnv` names three bindings and neither `r2_buckets` nor `tail_consumers` is one of them,
so deleting either block from `env.production` passed the name check untouched.

**`[observability]` is inheritable too, and this file writes it out three times anyway.** It was the example
the paragraph above used for the safe-to-inherit kind while the file restated it in both named environments,
so a reader who trusted the sentence and tidied the copies away would have deleted the wrong block. The three
copies are kept rather than collapsed because sampling is the setting whose wrong value hides every other
symptom, and reading it per environment costs nothing; `tests/docs-consistency.test.ts` now asserts that the
three are identical, and separately that `[assets]` and `[placement]` are written once and nowhere else. If
you would rather collapse them, change the assertion in the same commit.

**`NEXT_PUBLIC_SITE_URL` is resolved twice, and the two resolutions disagree on a preview.** No file reads
`process.env.NEXT_PUBLIC_SITE_URL`; every read goes through the Cloudflare context. But that context resolves
differently depending on when it is asked:

- **Per request**, on the deployed worker, it is the Worker's runtime var. [`_deploy-web.yml`](../../.github/workflows/_deploy-web.yml) passes
  `--var NEXT_PUBLIC_SITE_URL:<inputs.url>`, so `sitemap.xml`, the API routes and the `.well-known` handler
  all name the host actually being served; a per-PR preview names itself.
- **During `next build`**, there is no request, so `getCloudflareContext({ async: true })` falls back to
  `getPlatformProxy`, which reads `wrangler.toml`'s **top-level** `[vars]`. `cf:build` passes no `--env`, so
  every build, production and preview alike, bakes `https://forever-pto.com` into whatever is prerendered.
  `robots.txt` is fully static with no revalidation and keeps it for the life of the deployment; the
  `[locale]` shells carry it in `canonical`, `hrefLang` and `og:url` until their 24-hour revalidation.

So a preview's `robots.txt` advertises the production sitemap. That is tolerated rather than fixed because
previews sit behind Cloudflare Access: nothing crawls them, which is why [`playwright.config.ts`](./playwright.config.ts) has to send
`CF-Access-Client-Id`/`Secret` to reach one. Do not "fix" it by giving the build step the override without
first checking whether the value is still correct for production, which shares that build path. The
`NEXT_PUBLIC_SITE_URL` line inside `[env.development.vars]` is the fallback for a hand-run
`wrangler deploy --env development` only: CI always overrides that one key, and the build never reads it.

**The rest of `[env.development.vars]` is load-bearing on every preview, and deleting the block breaks
them.** `--var` merges, it does not replace: wrangler reads the selected environment's `[vars]` into the
binding set and only then overwrites the individual keys the flag names. `_deploy-web.yml` passes exactly
one, `NEXT_PUBLIC_SITE_URL`, so `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXTJS_ENV` and `TURSO_DATABASE_URL` reach every
per-PR worker straight from `wrangler.toml`. Only the site URL is dead weight there, and it is not removable
either: without it a hand-run development deploy would fall through to the top-level `[vars]` and advertise
itself as `forever-pto.com`. Read the whole block as configuration, not residue.

**The deploy passes `--message`, and the value is one hyphenated token on purpose.** Every form of
`--message "<sha> <separator> <event>"` tried made wrangler 4.115 fail with `Unknown argument: push`; the
last word of the message arrived as a second positional beside `deploy [path]`. It was not the quoting
(`pnpm exec` passes argv through untouched, and `nick-fields/retry` was wrongly blamed for it first), and not
the separator character. `_deploy-web.yml` now passes `${{ github.sha }}-${{ github.event_name }}`, which
contains no spaces at all and so cannot split. That diagnosis was made against wrangler **4.115** and the pin
has since moved to **4.121.0**; nothing has been re-verified, so treat the mechanism as recorded rather than
retested, and reintroduce any multi-word form from a PR where the preview deploy exercises the same file.

**No `wrangler deploy` in this repo is wrapped in `nick-fields/retry`'s usual forgiveness for argument
errors**: not the app's in `_deploy-web.yml`, and not the tail Worker's in `ci.yml`. A wrapper that retries
every failure cannot tell a bad argument from a bad network, and this failure burned three identical attempts
per run before reporting. The secret uploads and the preview delete keep their retry; all are idempotent and
all fail for reasons that a second attempt can fix. `tests/docs-consistency.test.ts` counts the deploy steps
rather than naming one workflow, so a third deploy is covered the day it appears.

**The same now goes for the build, which was the rule's largest exception and was never on its list.**
`_deploy-web.yml`'s `Build` step wrapped `pnpm run cf:build` in `nick-fields/retry` with `max_attempts: 3`
and `timeout_minutes: 10`, so a type error, or the `partialPrefetching`-on-16.2 config error
[ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md) warns about, burned up to half an
hour across three identical attempts before reporting. `next build` fails deterministically far more often
than it fails for a reason a second attempt can fix, so the wrapper is gone and the step is a plain `run:`
scoped with `working-directory`. The contract suite counts build steps the same way it counts deploys, so
`docs.yml`'s build is covered too.
