# CLAUDE.md

Agent-facing guide for **forever-pto** — a planner that turns a fixed budget of paid days off into the
longest possible stretches away from work. See [CONTEXT.md](./CONTEXT.md) for the domain glossary (PTO Day,
Bridge, Suggestion, Alternative, Effective Day, Efficiency, Donation…); do not duplicate it here, and use its
canonical names in code, copy and docs.

## What this is

A Next.js 16 App Router app deployed to Cloudflare Workers through OpenNext. The user picks a Country, an
optional Region, a year and a PTO budget; the planner finds the Bridges that turn that budget into the
longest stretches off, and reports how well it did. **The whole planner runs in the browser** — the server
holds payment and contact records and nothing else ([ADR 0001](./docs/adr/0001-planner-runs-in-the-browser.md)).
The server side is five API route handlers (`check-session`, `contact`, `health`, `markdown`, `payment`), the
Stripe webhook, a `.well-known` catch-all, `middleware.ts`, and some static rendering.

Premium (advanced metrics, manual editing of a Suggestion) is unlocked by a Donation. There are no accounts:
the payment record *is* the entitlement ([ADR 0008](./docs/adr/0008-premium-derived-from-payment.md)).

## Stack

- **Next.js 16** App Router + **React 19**, `next-intl` for i18n over six locales (en, es, ca, it, de, fr)
- **Zustand** stores for all client state, persisted to local storage through an obfuscating wrapper
  ([ADR 0007](./docs/adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md))
- **Effect 3** on every server path that talks to Stripe, Turso or Resend — typed error channel, dependencies
  injected as service tags ([ADR 0002](./docs/adr/0002-effect-for-external-service-boundaries.md))
- **Temporal** via `temporal-polyfill`, never the global
  ([ADR 0005](./docs/adr/0005-temporal-polyfill.md))
- **Tailwind CSS v4** + shadcn/ui; **Turso** via `@tursodatabase/serverless` — hand-written SQL, no ORM;
  **Stripe**; **Resend**; **BetterStack**
- **Cloudflare Workers** via `@opennextjs/cloudflare`, R2 for the incremental cache, KV for the payment rate
  limiter ([ADR 0004](./docs/adr/0004-cloudflare-workers-as-deployment-target.md))
- **Biome** (lint + format), **Vitest** (unit, `happy-dom`), **Playwright** (e2e), **semantic-release** +
  commitlint, **husky** + lint-staged

## Versions (pinned — match exactly)

- Node **26.3.0** (`.nvmrc`, mirrored in `engines.node`) — `.nvmrc` is what every CI job installs
- pnpm **11.18.0** (`packageManager`) — always use pnpm, never npm/yarn

## Commands

```bash
pnpm dev                # next dev --turbopack
pnpm build              # next build
pnpm preview            # opennextjs-cloudflare build && preview (real Workers runtime)
pnpm deploy             # cf:build && opennextjs-cloudflare deploy
pnpm cf:typegen         # regenerate cloudflare-env.d.ts from wrangler.toml (reference only)

pnpm lint:all           # biome lint over the repo (:fix to autofix)
pnpm format:all         # biome check --write over the repo
pnpm lint:ts:typecheck  # tsc --noEmit

pnpm test:ut            # vitest run (unit)
pnpm test:docs          # docs ⟷ code consistency alone (also runs inside test:ut)
pnpm test:coverage      # vitest run --coverage
pnpm test:e2e           # playwright
```

Env: copy `.env.example`. Local Worker secrets go in `.dev.vars`. The typed surface the build uses is
`environment.d.ts` and nothing else — it hand-declares both `ProcessEnv` and the global `CloudflareEnv` the
Cloudflare context is read through, and it is tracked.

`pnpm cf:typegen` writes wrangler's own inference to `cloudflare-env.d.ts` at the repo root. It is reference
material, not part of the program: read it when adding a binding, then widen `environment.d.ts` by hand. Two
lines keep it that way and both are load-bearing — `.gitignore` so it never gets committed, and an explicit
`cloudflare-env.d.ts` entry in `tsconfig.json`'s `exclude`, because `include` is `**/*.ts` and would otherwise
pull a root-level `.d.ts` straight into the program.

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
  infrastructure/     # everything outbound: clients, services, workers, proxy, api error mapping
  ui/                 # adapters, hooks, i18n, modules (components), styles, assets
e2e/                  # Playwright specs
docs/                 # adr/, plans/, and docs-consistency.test.ts
```

**`tsconfig.json` is trimmed to what TypeScript 7 does not already do.** `strict`, `module: esnext`,
`esModuleInterop` and `allowJs: false` are gone because 7 makes the first two its defaults and forces the
third; `baseUrl` is a hard error there, which is why every entry in `paths` is relative to the project root.
Two survivors look equally redundant and are not — `types: ['node']`, because 7 changed that default from
every installed `@types` package to **none**, and `exclude`'s `cloudflare-env.d.ts`, for the reason below.
Neither is left to discipline: `docs/docs-consistency.test.ts` asserts both, and asserts that no option 7
removed has crept back.

Path aliases (`tsconfig.json` `compilerOptions.paths`): `src/*`, `@app/*`, `@application/*`, `@domain/*`,
`@infrastructure/*`, `@ui/*`, `@assets/*` (→ `src/ui/assets`), `@styles/*` (→ `src/ui/styles`), `@i18n/*`
(→ `src/ui/i18n`). Prefer aliases over relative paths for cross-layer imports; keep same-folder imports
relative. `vitest.config.ts` sets `resolve.tsconfigPaths`, so a new alias needs exactly one edit — in
`tsconfig.json`, not in the test config.

Unit tests are co-located with the code they cover (`src/**/*.test.ts`, `.test.tsx` for components). The one
test covering no single module is `docs/docs-consistency.test.ts`, colocated with the docs it checks.

**Nested guides** — read the one for the folder you are touching; they carry the detail this file omits:

| Folder | Covers |
| --- | --- |
| [`src/app/`](./src/app/CLAUDE.md) | Route groups, the `[locale]` segment, API route handlers, metadata |
| [`src/application/`](./src/application/CLAUDE.md) | Layer contract: what orchestration may touch |
| [`src/application/dto/`](./src/application/dto/CLAUDE.md) | The DTO mapping convention, one folder per concept |
| [`src/application/stores/`](./src/application/stores/CLAUDE.md) | The five Zustand stores, persistence, rehydration |
| [`src/application/use-cases/`](./src/application/use-cases/CLAUDE.md) | Effect entry points and how they terminate |
| [`src/domain/`](./src/domain/CLAUDE.md) | Layer contract: the two bounded contexts and their different rules |
| [`src/domain/calendar/`](./src/domain/calendar/CLAUDE.md) | The planning engine: bridges, strategies, metrics, the cache protocol |
| [`src/domain/payment/`](./src/domain/payment/CLAUDE.md) | Payment events, factory and handlers |
| [`src/infrastructure/`](./src/infrastructure/CLAUDE.md) | Layer contract: the only layer that reaches outward |
| [`src/infrastructure/api/`](./src/infrastructure/api/CLAUDE.md) | Failure → HTTP status mapping |
| [`src/infrastructure/clients/`](./src/infrastructure/clients/CLAUDE.md) | Effect service tags for db, email, logging, payments |
| [`src/infrastructure/services/holidays/`](./src/infrastructure/services/holidays/CLAUDE.md) | Holiday lookup and normalisation |
| [`src/infrastructure/services/location/`](./src/infrastructure/services/location/CLAUDE.md) | Country detection strategies |
| [`src/infrastructure/services/payments/`](./src/infrastructure/services/payments/CLAUDE.md) | Stripe provider, repository, promo codes |
| [`src/infrastructure/workers/`](./src/infrastructure/workers/CLAUDE.md) | The calculations Web Worker and its message contract |
| [`src/ui/`](./src/ui/CLAUDE.md) | Layer contract: adapters, hooks, modules, styles |
| [`src/ui/i18n/`](./src/ui/i18n/CLAUDE.md) | Message bundles, namespaces, adding a locale |
| [`src/ui/modules/`](./src/ui/modules/CLAUDE.md) | How component folders are organised |
| [`src/ui/modules/core/`](./src/ui/modules/core/CLAUDE.md) | Primitives and the animation layer |
| [`src/ui/modules/pages/planner/`](./src/ui/modules/pages/planner/CLAUDE.md) | The planner screen: calendar, holidays, summary |
| [`src/ui/styles/`](./src/ui/styles/CLAUDE.md) | Layer order, tokens, what Biome does not format |

## Conventions

- **Use the glossary's words.** [CONTEXT.md](./CONTEXT.md) names one canonical term per concept and lists the
  retired ones. A variable called `vacationDays` where the glossary says PTO Day is a defect, not a style
  preference — the vocabulary is the only thing keeping four names for the same number apart.
- **No explanatory comments anywhere under `src/`.** The folder's `CLAUDE.md` carries the explanation
  instead: a magic constant, a deliberate deviation, an ordering that looks wrong but is not, all belong in
  that folder's *Invariants* or *Gotchas* section, not above the line. A comment is invisible to everyone who
  is not already reading that file and nothing checks it against the code; a guide is read before the folder
  is touched, and `docs/docs-consistency.test.ts` does check it. Directives (`'use client'`, `'use server'`,
  `'use cache'`) are strings, not comments, and are unaffected. Two things are **not** explanatory comments
  and stay: a `biome-ignore` suppression, which changes what the linter does and must carry its reason on the
  same line; and the do-not-edit banner on generated output (`src/ui/modules/bones/registry.ts`). A
  suppression counts in either form, including the `{/* biome-ignore … */}` shape JSX forces. The rule is
  asserted wherever a comment sits — opening a line, trailing code, or inside JSX — and it stops at `src/`,
  because `docs/docs-consistency.test.ts` explains itself inline: it is the one source file with no folder
  guide behind it.
- **No re-export barrel files.** Import from the source module; a pass-through `index.ts` hides the real
  dependency graph and defeats the layer rules.
- **No ALL-CAPS in translation strings.** Uppercasing is a presentation choice — do it with a CSS class in the
  component, so the six bundles stay comparable and other scripts are not mangled.
- **`typeof window`/`typeof document` guards stay.** They look redundant to a linter but are required under
  SSR: the bare identifier throws `ReferenceError` on the server.
- **Cross-layer imports use the alias, same-folder imports stay relative.** Mixed forms of the same module
  break Biome's import sorting.
- **Conventional commits** (commitlint + husky). semantic-release owns versioning. Do NOT add a
  Co-Authored-By / Claude trailer to commits or PRs.

## Maintenance contract

These documents are not generated. A change that does not update them leaves the tree describing code that no
longer exists, so when you change code, update the docs **in the same commit** — a follow-up commit is a
promise, not a fix.

Four artefacts, four jobs:

| Document | Answers | Update it when |
| --- | --- | --- |
| [`CONTEXT.md`](./CONTEXT.md) (root only) | *What does this word mean?* A domain glossary, and nothing else — no file names, no libraries, no implementation detail | A domain term changes meaning, a new one appears, or a second name for an existing concept shows up in the code or the UI |
| `src/**/CLAUDE.md` | *What may I touch here, and how is this folder built?* Layer contract at a layer root; files, public API, invariants and gotchas below it. Its `# ` heading is the folder's own path, repo-relative — `# src/domain/calendar`, never `# domain/calendar` | You change a layer's dependencies, a signature, an invariant, or the files in that folder |
| [`docs/adr/`](./docs/adr/) | *Why is it like this?* One decision per file | You make a decision that is hard to reverse, surprising without context, **and** the result of a real trade-off. If any of the three is missing, skip the ADR |
| [`README.md`](./README.md) | *What is this product and how do I run it?* The human-facing front page | The product's capabilities, the stack table, the scripts or the required versions change |

`CONTEXT.md` is reserved for the root glossary. **Never create a nested one** — the name would mean two
things, and the `domain-modeling` skill reads it as vocabulary and would rewrite a layer contract as a term
list.

| If you change | Update |
| --- | --- |
| What a domain word means, or introduce a new one | [`CONTEXT.md`](./CONTEXT.md) — the glossary, vocabulary only |
| A folder's layout, the files a concept is made of, or a rule its guide states | that folder's nested `CLAUDE.md` (table above) |
| A behaviour a doc states as an invariant or a gotcha | that bullet, or delete it if it stopped being true |
| A layer's allowed imports | that layer's `CLAUDE.md`, and the ADR that decided the boundary |
| A package script, a path alias, or the folder tree | the *Commands* / *Structure & aliases* sections here, and `README.md` if it lists the script |
| A translation key | all six bundles under `src/ui/i18n/messages/` — parity is asserted |
| A decision an ADR records | that ADR — amend it, or supersede it and say so in both `## Status` blocks |

[`docs/docs-consistency.test.ts`](./docs/docs-consistency.test.ts) makes the mechanical half of that contract
executable. It runs with `pnpm test:ut` (so, in CI on every PR) and asserts: that `CONTEXT.md` exists only at
the root, is linked from here, and stays a glossary — no paths, no identifiers, no call signatures, every term
defined, no empty `_Avoid_` list, no term listing itself as its own alternative; that every layer root and
every folder in the *Nested guides* table has a `CLAUDE.md`; that ADRs are named `NNNN-slug.md`, numbered
contiguously from `0001`, carry the template's sections, and are each linked from some document **outside**
`docs/adr/` — an ADR nothing points at will not be read; that every relative markdown link resolves and every
`.ts`/`.tsx` file named in backticks still exists; that every script this file documents exists in
`package.json`, that every alias `tsconfig.json` declares is documented here and every alias documented here
is declared there, and that no alias points at a missing directory; that `tsconfig.json` still carries the two
settings TypeScript 7 makes load-bearing — an explicit `types` and `cloudflare-env.d.ts` in both `exclude` and
`.gitignore` — and none of the options 7 removed; and that every locale bundle has exactly the keys
`en.json` has.

It reads staged *and* unstaged files, so a rule fires before the offending file is committed. **Each rule was
verified by breaking it and confirming the matching case fails** — keep that property when you add one. A
failure means the docs and the code disagree; fix whichever is wrong. It cannot check rationale — whether an
explanation is honest — and that part is on you.

Two traps worth naming: deleting a resolved entry from a "known inconsistencies" list is part of the fix, not
tidying to do later; and a `file.ts:123` citation rots the moment anything above it moves — name the symbol
instead.

Propose an ADR when a decision is **hard to reverse**, **surprising without context** and **the result of a
real trade-off**. All three, or it is not an ADR. Copy [ADR 0000](./docs/adr/0000-adr-template.md), number it
one above the highest existing file, and link it from wherever it bites — a gotcha here, a nested guide, a
`CONTEXT.md` entry.

## Gotchas

- **The calculation caches are cleared by the caller, not the engine.** `cache.ts` memoises the holiday set
  under one fixed key and never evicts it, so a second run silently reuses the first run's holidays. Both
  callers — `worker.ts` and the holidays store — must clear before every full run, and a third caller means
  switching to a content-derived key. [ADR 0006](./docs/adr/0006-caller-owned-calculation-caches.md).
- **`Temporal` comes from `temporal-polyfill`, never the global.** The global does not resolve in the deployed
  Workers runtime, and a local run proves nothing. Do not let a codemod "modernise" the import.
  [ADR 0005](./docs/adr/0005-temporal-polyfill.md).
- **Persisted store state is obfuscated, not encrypted.** XOR + base64 with a key shipped in the bundle. Never
  call it encryption and never put anything confidential behind it.
  [ADR 0007](./docs/adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md).
- **The "I already donated" path is unverified, and Premium is never revoked.** v1 ships with no accounts and
  no user authentication, so the recovery path grants Premium to anyone who types an address with a succeeded
  payment behind it, and there is no revocation path for a donor. Both follow from the decision, not from an
  oversight — do not "harden" either in passing. There *is* a session layer: the entitlement travels in a
  signed HTTP-only cookie.
  [ADR 0008](./docs/adr/0008-premium-derived-from-payment.md).
- **The two bounded contexts under `src/domain/` follow different rules.** `calendar/` is pure because it runs
  in a Web Worker; `payment/` composes Effect against infrastructure tags. Neither is lint-enforced.
  [ADR 0003](./docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md).
- **Logging is the one external call that does not go through Effect.** BetterStack has both a service tag and
  a plain singleton, and the singleton is what the stores, lookups and components use.
  [ADR 0002](./docs/adr/0002-effect-for-external-service-boundaries.md).
- **The Cloudflare context is request-scoped.** Route handlers and server actions may read it; use-cases may
  not, and must receive configuration as plain values.
  [ADR 0004](./docs/adr/0004-cloudflare-workers-as-deployment-target.md).
- **Biome's `noConsole` is a warning with `warn`/`error` allowed**, not an error — `console.log` will not fail
  the build, so it is on you not to leave one behind.
- **The planning pipeline exists twice and the copies must stay in step.** The Web Worker and the holidays
  store's own action compute the same plan from the same inputs; mirrored test blocks hold them together.
  They have drifted before, and the symptom is one Planning Window producing two different plans depending on
  which path ran. See [`src/application/stores/CLAUDE.md`](./src/application/stores/CLAUDE.md).

## Deploy

Cloudflare Workers via wrangler (`wrangler.toml`): `.open-next/worker.js` as the entrypoint, `.open-next/assets`
served through the `ASSETS` binding, an R2 bucket for the incremental cache, a `RATE_LIMIT_KV` namespace for
the payment rate limiter, smart placement, and a `forever-pto-tail` tail consumer. Only `env.production` binds
a route (`forever-pto.com/*`); `env.development` supplies the preview bindings and CI deploys one worker per
PR from it — `pr-<number>-forever-pto-development.fbuireu.workers.dev`, deleted when the PR closes.

**`NEXT_PUBLIC_SITE_URL` is resolved twice, and the two resolutions disagree on a preview.** No file reads
`process.env.NEXT_PUBLIC_SITE_URL`; every read goes through the Cloudflare context. But that context resolves
differently depending on when it is asked:

- **Per request**, on the deployed worker, it is the Worker's runtime var. `_deploy.yml` passes
  `--var NEXT_PUBLIC_SITE_URL:<inputs.url>`, so `sitemap.xml`, the API routes and the `.well-known` handler
  all name the host actually being served — a per-PR preview names itself.
- **During `next build`**, there is no request, so `getCloudflareContext({ async: true })` falls back to
  `getPlatformProxy`, which reads `wrangler.toml`'s **top-level** `[vars]`. `cf:build` passes no `--env`, so
  every build — production and preview alike — bakes `https://forever-pto.com` into whatever is prerendered.
  `robots.txt` is fully static with no revalidation and keeps it for the life of the deployment; the
  `[locale]` shells carry it in `canonical`, `hrefLang` and `og:url` until their 24-hour revalidation.

So a preview's `robots.txt` advertises the production sitemap. That is tolerated rather than fixed because
previews sit behind Cloudflare Access — nothing crawls them, which is why `playwright.config.ts` has to send
`CF-Access-Client-Id`/`Secret` to reach one. Do not "fix" it by giving the build step the override without
first checking whether the value is still correct for production, which shares that build path. The
`[env.development.vars]` entry is the fallback for a hand-run `wrangler deploy --env development` only: CI
always overrides it, and the build never reads it. Build config lives in `next.config.ts` and
`open-next.config.ts`.

GitHub Actions: `ci.yml` on every PR, `deploy-development.yml` / `deploy-production.yml` calling the shared
`_deploy.yml`, plus dependabot/renovate auto-merge and a `zizmor` workflow audit. Husky runs `lint-staged` on
`pre-commit`, `commitlint` on `commit-msg` and `lint:ts:typecheck` on `pre-push`.
