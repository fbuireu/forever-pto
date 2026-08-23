# apps/web

## What this is

**forever-pto** — a planner that turns a fixed budget of paid days off into the longest possible stretches
away from work. The user picks a Country, an optional Region, a year and a PTO budget; the planner finds the
Bridges that turn that budget into the longest stretches off, and reports how well it did.

**The whole planner runs in the browser** — the server holds payment and contact records and nothing else
([ADR 0001](../../adr/0001-planner-runs-in-the-browser.md)). The server side is seven API route handlers
(`check-session`, `contact`, `health`, `markdown`, `payment`, `payment/activate`), the Stripe webhook, a
`.well-known` catch-all, [`middleware.ts`](./src/middleware.ts), and some static rendering.

Premium (advanced metrics, manual editing of a Suggestion) is unlocked by a Donation. There are no accounts:
the payment record *is* the entitlement ([ADR 0008](../../adr/0008-premium-derived-from-payment.md)).

The vocabulary is the repo glossary's — see [`CONTEXT.md`](../../CONTEXT.md).

## Stack

- **Next.js 16** App Router + **React 19**, `next-intl` for i18n over six locales (en, es, ca, it, de, fr)
- **Zustand** stores for all client state, persisted to local storage through an obfuscating wrapper
  ([ADR 0007](../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md))
- **Effect 3** on every server path that talks to Stripe, Turso or Resend — typed error channel, dependencies
  injected as service tags ([ADR 0002](../../adr/0002-effect-for-external-service-boundaries.md))
- **Temporal** via `temporal-polyfill`, never the global
  ([ADR 0005](../../adr/0005-temporal-polyfill.md))
- **Tailwind CSS v4** + shadcn/ui; **Turso** via `@tursodatabase/serverless` — hand-written SQL, no ORM;
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
pnpm test:e2e           # playwright
```

Env: copy `.env.example`. Local Worker secrets go in `.dev.vars`. The typed surface the build uses is
[`environment.d.ts`](./environment.d.ts) and nothing else — it hand-declares both `ProcessEnv` and the global `CloudflareEnv` the
Cloudflare context is read through, and it is tracked.

`pnpm cf:typegen` writes wrangler's own inference to `cloudflare-env.d.ts` in this folder. It is reference
material, not part of the program: read it when adding a binding, then widen `environment.d.ts` by hand. Two
lines keep it that way and both are load-bearing — `.gitignore` so it never gets committed, and an explicit
`cloudflare-env.d.ts` entry in [`tsconfig.json`](./tsconfig.json)'s `exclude`, because `include` is `**/*.ts` and would
otherwise pull a package-root `.d.ts` straight into the program.

Letting it in does not fail the way you would expect. It declares `CloudflareEnv` a second time, with `[vars]`
typed as string literals where `environment.d.ts` says `string`, but `skipLibCheck: true` means those two
declarations are never compared — that clash only surfaces with `skipLibCheck: false`. What actually breaks is
the other 14,000 lines: the workerd runtime globals replace `lib.dom`'s `Response`, and roughly fifty call
sites start reporting `'body' is of type 'unknown'`.

## Structure & aliases

```
src/
  middleware.ts       # locale + country cookies, markdown rewrite; skips /api/* except /api/markdown
  app/                # App Router: [locale]/(app|marketing) pages, api/ route handlers, sitemap, robots
  application/        # use-cases, DTOs, Zustand stores, export, email templates — orchestration, no I/O clients
  domain/             # calendar/ (pure planning engine) and payment/ (Effect programs)
  infrastructure/     # everything outbound: clients, services, workers, proxy, api operations, seo route table
  ui/                 # adapters, hooks, i18n, modules (components), styles, assets
e2e/                  # Playwright specs
workers/tail/         # the tail consumer Worker, with its own wrangler.toml
public/               # static assets
```

Path aliases (`tsconfig.json` `compilerOptions.paths`): `src/*`, `@app/*`, `@application/*`, `@domain/*`,
`@infrastructure/*`, `@ui/*`, `@assets/*` (→ `src/ui/assets`), `@styles/*` (→ `src/ui/styles`), `@i18n/*`
(→ `src/ui/i18n`). Prefer aliases over relative paths for cross-layer imports; keep same-folder imports
relative. There is no `baseUrl`, so every target resolves against this `tsconfig.json` — the aliases needed
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
every run and writes its own default for any key that is absent — `strict: false` and `allowJs: true`. Both
land at the *next build* rather than at the deletion site, so deleting either as noise turns strict mode off,
or lets JavaScript into a TypeScript-only codebase, a long way from the change.
`tests/docs-consistency.test.ts` asserts both, asserts that this `tsconfig.json` stays beside the
[`next.config.ts`](./next.config.ts) that rewrites it, and asserts that `cloudflare-env.d.ts` stays excluded and ignored.

**TypeScript stays on 6 and Next stays on 16.2, and the pair is one decision, forced by Cloudflare.** Next 16.3
crashes the deployed Worker on any route rendered at request time: `@opennextjs/cloudflare` 1.20.2 is the
latest adapter and shipped 2026-08-01, two days before 16.3.0 existed, and there is no newer version or beta.
The symptom is the 404 page answering with Cloudflare **Error 1101 (Worker threw exception)** instead of
itself, which is what `e2e/[locale]/not-found.spec.ts` catches. `/_not-found` is the only page that renders
per request — everything else is prerendered and served from cache, so nothing else shows it.
[ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md).

TypeScript is pinned to 6 because it cannot move without Next moving first. TypeScript 7 ships the Go compiler
and no `lib/typescript.js`, and Next's type-checking path loads exactly that file; only from 16.3 does
`next build` shell out to the project-local `tsc` instead. So raising TypeScript to 7 while Next is 16.2 kills
`pnpm build` before it type-checks anything. Raise Next first, and only once the adapter supports it.

Two things follow that are easy to trip over. `partialPrefetching` in `next.config.ts` is a 16.3 option and is
a config error on 16.2 — it must stay out while Next is pinned. And
[`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) imports `typescript` directly for its
compiler-API parsing; under TypeScript 7 that import has to become `@typescript/typescript6`, Microsoft's
compatibility package pinning the 6.x API, so the two move together too. The pin now appears in three
manifests — this one, the repo root and `apps/docs` — and only this one is load-bearing for `next build`.
Nothing asserts they stay equal.

Unit tests are co-located with the code they cover (`src/**/*.test.ts`, `.test.tsx` for components).

**Nested guides** — read the one for the folder you are touching; they carry the detail this file omits:

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
  `{/* biome-ignore … */}` shape JSX forces. The rule is asserted wherever a comment sits — opening a line,
  trailing code, or inside JSX.
- **No ALL-CAPS in translation strings.** Uppercasing is a presentation choice — do it with a CSS class in the
  component, so the six bundles stay comparable and other scripts are not mangled.
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
  oversight — do not "harden" either in passing. There *is* a session layer: the entitlement travels in a
  signed HTTP-only cookie.
  [ADR 0008](../../adr/0008-premium-derived-from-payment.md).
- **The two bounded contexts under `src/domain/` follow different rules.** `calendar/` is pure because it runs
  in a Web Worker; `payment/` composes Effect against infrastructure tags. Neither is lint-enforced.
  [ADR 0003](../../adr/0003-pure-calendar-domain-effectful-payment-domain.md).
- **Logging is the one external call that does not go through Effect.** BetterStack has both a service tag and
  a plain singleton, and the singleton is what the stores, lookups and components use.
  [ADR 0002](../../adr/0002-effect-for-external-service-boundaries.md).
- **The Cloudflare context is request-scoped.** Route handlers and server actions may read it; use-cases may
  not, and must receive configuration as plain values.
  [ADR 0004](../../adr/0004-cloudflare-workers-as-deployment-target.md).
- **The planning pipeline exists once, and used to exist twice.** `runPlanningPipeline` under
  `src/domain/calendar/` is the whole run — caches, pseudo-Holidays, budget, both planning calls, the Metrics.
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
`forever-pto-tail` tail consumer, which is its own Worker under `workers/tail/` and is deployed by the `deploy-tail` job when its own files change. Only `env.production` binds a route (`forever-pto.com/*`);
`env.development` supplies the preview bindings and CI deploys one worker per PR from it —
`pr-<number>-forever-pto-development.fbuireu.workers.dev`, deleted when the PR closes.

Every path in `wrangler.toml` is relative to the file itself, so the deploy runs with this package as the
working directory. Build config lives in `next.config.ts` and [`open-next.config.ts`](./open-next.config.ts).

**`NEXT_PUBLIC_SITE_URL` is resolved twice, and the two resolutions disagree on a preview.** No file reads
`process.env.NEXT_PUBLIC_SITE_URL`; every read goes through the Cloudflare context. But that context resolves
differently depending on when it is asked:

- **Per request**, on the deployed worker, it is the Worker's runtime var. [`_deploy-web.yml`](../../.github/workflows/_deploy-web.yml) passes
  `--var NEXT_PUBLIC_SITE_URL:<inputs.url>`, so `sitemap.xml`, the API routes and the `.well-known` handler
  all name the host actually being served — a per-PR preview names itself.
- **During `next build`**, there is no request, so `getCloudflareContext({ async: true })` falls back to
  `getPlatformProxy`, which reads `wrangler.toml`'s **top-level** `[vars]`. `cf:build` passes no `--env`, so
  every build — production and preview alike — bakes `https://forever-pto.com` into whatever is prerendered.
  `robots.txt` is fully static with no revalidation and keeps it for the life of the deployment; the
  `[locale]` shells carry it in `canonical`, `hrefLang` and `og:url` until their 24-hour revalidation.

So a preview's `robots.txt` advertises the production sitemap. That is tolerated rather than fixed because
previews sit behind Cloudflare Access — nothing crawls them, which is why [`playwright.config.ts`](./playwright.config.ts) has to send
`CF-Access-Client-Id`/`Secret` to reach one. Do not "fix" it by giving the build step the override without
first checking whether the value is still correct for production, which shares that build path. The
`NEXT_PUBLIC_SITE_URL` line inside `[env.development.vars]` is the fallback for a hand-run
`wrangler deploy --env development` only: CI always overrides that one key, and the build never reads it.

**The rest of `[env.development.vars]` is load-bearing on every preview, and deleting the block breaks
them.** `--var` merges, it does not replace: wrangler reads the selected environment's `[vars]` into the
binding set and only then overwrites the individual keys the flag names. `_deploy-web.yml` passes exactly
one, `NEXT_PUBLIC_SITE_URL`, so `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXTJS_ENV` and `TURSO_DATABASE_URL` reach every
per-PR worker straight from `wrangler.toml`. Only the site URL is dead weight there, and it is not removable
either — without it a hand-run development deploy would fall through to the top-level `[vars]` and advertise
itself as `forever-pto.com`. Read the whole block as configuration, not residue.

**The deploy passes `--message`, and the value is one hyphenated token on purpose.** Every form of
`--message "<sha> <separator> <event>"` tried made wrangler 4.115 fail with `Unknown argument: push` — the
last word of the message arrived as a second positional beside `deploy [path]`. It was not the quoting
(`pnpm exec` passes argv through untouched, and `nick-fields/retry` was wrongly blamed for it first), and not
the separator character. `_deploy-web.yml` now passes `${{ github.sha }}-${{ github.event_name }}`, which
contains no spaces at all and so cannot split. That diagnosis was made against wrangler **4.115** and the pin
has since moved to **4.121.0**; nothing has been re-verified, so treat the mechanism as recorded rather than
retested, and reintroduce any multi-word form from a PR where the preview deploy exercises the same file.

The deploy is the one wrangler call **not** wrapped in `nick-fields/retry`'s usual forgiveness for argument
errors: a wrapper that retries every failure cannot tell a bad argument from a bad network, and this failure
burned three identical attempts per run before reporting. The secret upload and the preview delete keep their
retry — both are idempotent and both fail for reasons that a second attempt can fix.
