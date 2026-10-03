# apps/web

## What this is

**forever-pto**: a planner that turns a fixed budget of paid days off into the longest possible stretches away from
work. The user picks a Country, an optional Region, a year and a PTO budget; the planner finds the Bridges that turn
that budget into the longest stretches off, and reports how well it did.

**The whole planner runs in the browser**: the server holds payment and contact records and nothing else
([ADR 0001](../../adr/0001-planner-runs-in-the-browser.md)). The server side is the API route handlers
(`check-session`, `contact`, `health`, `markdown`, `payment`, `payment/activate` and the Stripe webhook at
`webhooks/stripe`), a `.well-known` catch-all, [`middleware.ts`](./src/middleware.ts), and the pages: prerendered, but
for `payment/confirmation` and the global not-found page, which render per request.

Premium (advanced metrics, manual editing of a Suggestion) is unlocked by a Donation. There are no accounts: the
payment record *is* the entitlement ([ADR 0008](../../adr/0008-premium-derived-from-payment.md)).

The vocabulary is the repo glossary's; see [`CONTEXT.md`](../../CONTEXT.md).

## Stack

- **Next.js** App Router + **React**, `next-intl` for i18n across the supported locales (en, es, ca, it, de, fr)
- **Zustand** stores for all client state, persisted to local storage through an obfuscating wrapper
  ([ADR 0007](../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md))
- **Effect** on every server path that talks to Stripe, Turso or Resend
  ([ADR 0002](../../adr/0002-effect-for-external-service-boundaries.md))
- **Temporal** through `temporal-polyfill` ([ADR 0005](../../adr/0005-temporal-polyfill.md))
- **Tailwind CSS** + shadcn/ui; **Turso** via `@tursodatabase/serverless`: hand-written SQL, no ORM; **Stripe**;
  **Resend**; **BetterStack**, reached through the platform's log export rather than an SDK
- **Cloudflare Workers** via `@opennextjs/cloudflare`, R2 for the incremental cache, the platform's own rate-limiting
  binding for the payment limiter ([ADR 0004](../../adr/0004-cloudflare-workers-as-deployment-target.md))
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
pnpm typecheck          # tsc --noEmit

pnpm test:ut            # vitest run
pnpm test:ut:coverage   # vitest run --coverage
pnpm test:e2e           # playwright, against BASE_URL (see below)
```

**`pnpm test:e2e` takes `BASE_URL` when it is set and starts `next dev` when it is not.** CI always sets it, to a
deployed preview, which is the only place the Workers runtime is real: `ci.yml` passes the `e2e` job the same URL
[`_deploy-web.yml`](../../.github/workflows/_deploy-web.yml) passes to `--var NEXT_PUBLIC_SITE_URL`, so
`e2e/sitemap.spec.ts` can assert that the sitemap names the host it is served from. A preview also needs
`CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, which the config turns into request headers.

```bash
BASE_URL=https://pr-123-forever-pto-development.fbuireu.workers.dev pnpm test:e2e
```

The local target is `next dev`: `pnpm preview` would exercise the Workers runtime, but its `cf:build` fails on Windows
([ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md)), and a Workers-only failure such as
Cloudflare Error 1101 is what the preview run in CI is for. `reuseExistingServer` is on, so a dev server already
answering on 3000 is used.

No e2e case renders an error boundary, because no URL is known to provoke one:
`/payment/confirmation?payment_intent=<unknown>` renders the page's own failure card, since `confirmation` in
[`src/infrastructure/services/payments/confirmation.ts`](./src/infrastructure/services/payments/confirmation.ts) types
its error channel `never`. What the boundary does is pinned by
[`src/ui/modules/pages/error/ErrorContent.test.tsx`](./src/ui/modules/pages/error/ErrorContent.test.tsx).

Env: copy [`.env.example`](./.env.example). Local Worker secrets go in `.dev.vars`. The typed surface the build uses is
[`environment.d.ts`](./environment.d.ts) and nothing else; it hand-declares both `ProcessEnv` and the global
`CloudflareEnv` the Cloudflare context is read through, and it is tracked.

**A `NEXT_PUBLIC_*` is inlined at build time, and `PUBLIC_ENV` in [`next.config.ts`](./next.config.ts) is what fails
the build on a wrong one.** Each name maps to a zod schema, or to the `RUNTIME_ONLY` sentinel for the ones never
inlined (`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONTACT_EMAIL`, read server-side off `CloudflareEnv`, which is why
`wrangler.toml` declares them in `[vars]` and the build step passes neither). A variable that may be absent says
`.optional()`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must start with `pk_`, so a secret key pasted there fails the
build instead of shipping in a bundle. The guard is gated on `isProd`, so a fresh clone runs `pnpm dev` without a
Stripe key. A new public variable is a new entry: the contract suite holds `PUBLIC_ENV` to exactly the names
`environment.d.ts` declares, and each to where its kind says it is read.

`pnpm cf:typegen` writes wrangler's own inference to `cloudflare-env.d.ts` in this folder. It is reference material,
not part of the program: read it when adding a binding, then widen `environment.d.ts` by hand. It stays out of git
([`.gitignore`](../../.gitignore)) and out of the program ([`tsconfig.json`](./tsconfig.json)'s `exclude`, because
`include` is `**/*.ts`): let in, its workerd globals replace `lib.dom`'s `Response` and call sites across the app
report `'body' is of type 'unknown'`.

## Structure & aliases

```
src/
  middleware.ts            # locale + country cookies, markdown rewrite; skips /api/* except /api/markdown
  app/                # App Router: [locale]/(app|marketing) pages, api/ route handlers, sitemap, robots
  application/        # use-cases, DTOs, Zustand stores, export, email templates. Orchestration, no I/O clients
  domain/             # calendar/ (pure planning engine) and payment/ (Effect programs)
  infrastructure/     # everything outbound: clients, services, workers, proxy, api operations, seo route table
  ui/                 # adapters, hooks, i18n, modules (components), styles, utils, assets
e2e/                  # Playwright specs
public/               # static assets
```

Path aliases (`tsconfig.json` `compilerOptions.paths`): `@app/*`, `@application/*`, `@domain/*`, `@infrastructure/*`,
`@ui/*`, `@assets/*` (→ [`src/ui/assets`](./src/ui/assets)), `@styles/*` (→ [`src/ui/styles`](./src/ui/styles)),
`@i18n/*` (→ [`src/ui/i18n`](./src/ui/i18n)). There is no `baseUrl`, so every target resolves against this
`tsconfig.json`, and [`vitest.config.ts`](./vitest.config.ts) sets `resolve.tsconfigPaths`, so a new alias needs
exactly one edit, in `tsconfig.json`.

**Mock history is cleared before every test, so a suite asserting an import-time call has to snapshot it.** That is
Vitest's default. A file that asserts the call its top-level import made copies the calls into a module-scope const
beside the import (`const configuredAtLoad = [...mock.calls]`), as
[`src/ui/modules/providers/BonesProvider.test.tsx`](./src/ui/modules/providers/BonesProvider.test.tsx),
[`src/application/i18n/navigation.test.ts`](./src/application/i18n/navigation.test.ts) and
[`src/infrastructure/services/countries/getCountries.test.ts`](./src/infrastructure/services/countries/getCountries.test.ts)
do.

**`testTimeout` is raised well above the default**, because the suite builds a fresh `happy-dom` per file and the cases
that resolve every lazy chunk of a page are slow under that load. `pool: 'vmThreads'` or `isolate: false` would
build the DOM once per worker instead; neither has been measured against this suite.

**Next owns [`next-env.d.ts`](./next-env.d.ts), and it flaps**: a production build points its route import at
`.next/types/`, a dev run at `.next/dev/types/`. Leave whichever version is committed alone.

**`next build` rewrites `tsconfig.json` and writes its own default for any key that is absent**: `strict: false` and
`allowJs: true`. Neither setting is redundant, and the contract suite asserts both, and that this `tsconfig.json` stays
beside the [`next.config.ts`](./next.config.ts) that rewrites it.

**Nested guides**. Read the one for the folder you are touching; they carry the detail this file omits:

| Folder | Covers |
| --- | --- |
| [`./src/app/AGENTS.md`](./src/app/AGENTS.md) | Route groups, the `[locale]` segment, API route handlers, metadata |
| [`./src/application/AGENTS.md`](./src/application/AGENTS.md) | Layer contract: what orchestration may touch |
| [`./src/application/dto/AGENTS.md`](./src/application/dto/AGENTS.md) | The DTO mapping convention, one folder per concept |
| [`./src/application/stores/AGENTS.md`](./src/application/stores/AGENTS.md) | The Zustand stores, persistence, rehydration |
| [`./src/application/use-cases/AGENTS.md`](./src/application/use-cases/AGENTS.md) | Effect entry points and how they terminate |
| [`./src/domain/AGENTS.md`](./src/domain/AGENTS.md) | Layer contract: the bounded contexts and their different rules |
| [`./src/domain/calendar/AGENTS.md`](./src/domain/calendar/AGENTS.md) | The planning engine: bridges, strategies, metrics, the cache protocol |
| [`./src/domain/payment/AGENTS.md`](./src/domain/payment/AGENTS.md) | Payment events, factory and handlers |
| [`./src/infrastructure/AGENTS.md`](./src/infrastructure/AGENTS.md) | Layer contract: the only layer that reaches outward |
| [`./src/infrastructure/api/AGENTS.md`](./src/infrastructure/api/AGENTS.md) | Failure → HTTP status mapping |
| [`./src/infrastructure/clients/AGENTS.md`](./src/infrastructure/clients/AGENTS.md) | Effect service tags for db, email, logging, payments |
| [`./src/infrastructure/services/holidays/AGENTS.md`](./src/infrastructure/services/holidays/AGENTS.md) | Holiday lookup and normalisation |
| [`./src/infrastructure/services/location/AGENTS.md`](./src/infrastructure/services/location/AGENTS.md) | Country detection strategies |
| [`./src/infrastructure/services/payments/AGENTS.md`](./src/infrastructure/services/payments/AGENTS.md) | Stripe provider, repository, promo codes |
| [`./src/infrastructure/workers/AGENTS.md`](./src/infrastructure/workers/AGENTS.md) | The calculations Web Worker and its message contract |
| [`./src/ui/AGENTS.md`](./src/ui/AGENTS.md) | Layer contract: adapters, hooks, modules, styles |
| [`./src/ui/i18n/AGENTS.md`](./src/ui/i18n/AGENTS.md) | Message bundles, namespaces, adding a locale |
| [`./src/ui/modules/AGENTS.md`](./src/ui/modules/AGENTS.md) | How component folders are organised |
| [`./src/ui/modules/core/AGENTS.md`](./src/ui/modules/core/AGENTS.md) | Primitives and the animation layer |
| [`./src/ui/modules/pages/planner/AGENTS.md`](./src/ui/modules/pages/planner/AGENTS.md) | The planner screen: calendar, holidays, summary |
| [`./src/ui/styles/AGENTS.md`](./src/ui/styles/AGENTS.md) | Layer order, tokens, the cross-cutting stylesheets |

## Conventions

- **No comments in the TypeScript under `src/`**, doc comments included, bar a `biome-ignore` suppression, which
  carries its reason on the same line (in either form, `{/* biome-ignore … */}` included), and the do-not-edit banner
  on generated output ([`src/ui/modules/bones/registry.ts`](./src/ui/modules/bones/registry.ts)). The reason for a
  line goes in the commit message, the pull request, an ADR or [CODING_STANDARDS.md](../../CODING_STANDARDS.md).
  Directives (`'use client'`, `'use server'`) are strings, not comments. The contract suite fails on a comment wherever
  it sits: opening a line, trailing code, or inside JSX.

## Gotchas

- **Trusted Types is report-only, and enforcing it is a project rather than a flag.**
  [`next.config.ts`](./next.config.ts) sends `require-trusted-types-for 'script'` on a
  `Content-Security-Policy-Report-Only` header with **no** `trusted-types` allowlist, because policy names only guessed
  at would silence the violations the header collects. Enforcing it blanks the page until every sink has a policy:
  [`JsonLd.tsx`](./src/ui/modules/shared/seo/JsonLd.tsx) and
  [`HtmlLangSync.tsx`](./src/ui/modules/pages/not-found/HtmlLangSync.tsx) write through `dangerouslySetInnerHTML`, and
  Tag Manager, Stripe, `vanilla-cookieconsent` and `boneyard-js` each inject their own. Read the reports, wrap the
  sinks, then promote the directive.
- **Every build renames every Server Action, so a page from the previous deploy cannot call the current one.** The new
  Worker answers an old id with `NEXT_ACTION_NOT_FOUND` and the action never runs.
  [`recoverFromStaleDeployment`](./src/ui/adapters/navigation/staleDeployment.ts) wraps
  `unstable_isUnrecognizedActionError` from `next/navigation` and reloads. The closure encryption key also rotates per
  build unless `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` pins it: `_deploy-web.yml` passes that secret through optionally,
  and setting it on both `web-*` environments (the same `openssl rand -base64 32` value on both) closes the window,
  which reopens on every deploy for every page served before it.
- **The "I already donated" path is unverified, and Premium is never revoked.** With no accounts and no user
  authentication, the recovery path grants Premium to anyone who types an address with a succeeded payment behind it,
  and there is no revocation path for a donor. Both follow from
  [ADR 0008](../../adr/0008-premium-derived-from-payment.md); do not "harden" either in passing. The entitlement
  travels in a signed HTTP-only cookie.
- **The layer graph is published as a counted table on the documentation site's architecture overview**, and
  [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) asserts it against the tree in both
  directions, so a new cross-layer import fails the contract suite until the table is updated
  ([ADR 0014](../../adr/0014-ddd-where-it-pays.md)).
- **The package version is read at runtime, not only at release time.** Source files import
  [`package.json`](./package.json) for `version` to render the footer, the hero, the error page, the `/api/markdown`
  output and both `.well-known` documents; the docs site reads it too, and so does the Better Stack tag, which files
  every browser error under it as the release. A release run that fails after the deploy leaves production serving new
  code under the previous version.

## Deploy

Cloudflare Workers via wrangler ([`wrangler.toml`](./wrangler.toml)): `.open-next/worker.js` as the entrypoint,
exactly what OpenNext generates, `.open-next/assets` served through the `ASSETS` binding, an R2 bucket for the
incremental cache, a `PAYMENT_RATE_LIMITER` `[[ratelimits]]` binding for the payment limiter, and smart placement. Only
`env.production` binds a route (`forever-pto.com/*`); `env.development` supplies the preview bindings, and CI deploys
one worker per PR from it: `pr-<number>-forever-pto-development.fbuireu.workers.dev`, deleted when the PR closes. Build
config lives in `next.config.ts` and [`open-next.config.ts`](./open-next.config.ts).

**[`public/_headers`](./public/_headers) is what caches the hashed build output for good**, since Workers Static Assets
revalidate every file unless a `_headers` file in the assets directory says otherwise; OpenNext copies `public/` into
`.open-next/assets`, which is where it has to land. It gives `_next/static` the year-long `immutable` rule (asserted),
and [`public/fonts/stripe/`](./public/fonts/stripe/fonts.css), the font copy the Stripe Elements iframe loads, an
`Access-Control-Allow-Origin` and a week's `max-age` without `immutable`, since those names carry no hash.

**Logs and traces leave through `[observability.logs]` and `[observability.traces]`**, whose `destinations` name
settings in the Cloudflare dashboard that hold the OTLP endpoint and its token, so nothing in the deploy carries a
BetterStack credential and rotating the source needs no deploy.
[`logger.ts`](./src/infrastructure/logging/logger.ts) writes to `console`, which the platform attributes to the active
span ([ADR 0018](../../adr/0018-the-platform-is-the-log-transport.md)); every use case ends in `Effect.withSpan`,
which nothing consumes ([ADR 0017](../../adr/0017-observability-is-the-platform-export.md), which supersedes
[ADR 0016](../../adr/0016-traces-reach-betterstack-by-wrapping-the-opennext-entrypoint.md)). A destination belongs to
the account rather than to the Worker, and nothing here can assert that it exists: every environment names its own
pair, because a Worker naming another stage's destination exports into it, and the top level names production's.
`redact_query_string` stays on: it keeps `payment_intent_client_secret` out of the request URLs the platform records.
`NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN` is unrelated: it feeds the browser tag.

**Wrangler inherits configuration into a named environment but never a binding, so the repeated `[[ratelimits]]`
blocks are not duplication.** An environment that does not declare `vars`, `ratelimits` or `r2_buckets` does not have
them, and the limiter fails open for errors by design, so deleting `[[env.production.ratelimits]]` leaves
`POST /api/payment` and `POST /api/check-session` unbounded in front of Stripe, silently. `[observability]` is
restated in every environment on purpose, and `[assets]` and `[placement]` are written once; the contract suite
asserts all of it.

**`NEXT_PUBLIC_SITE_URL` resolves differently per request and at build.** Per request, on the deployed Worker, it is
the runtime var `_deploy-web.yml` passes (`--var NEXT_PUBLIC_SITE_URL:<inputs.url>`), so `sitemap.xml`, the API
routes and the `.well-known` handler name the host being served. During `next build` there is no request, so
`getCloudflareContext({ async: true })` reads `wrangler.toml`'s **top-level** `[vars]`, and every build bakes
`https://forever-pto.com` into what it prerenders: `robots.txt`, and the `canonical`, `hrefLang` and `og:url` of the
`[locale]` shells. A preview's `robots.txt` therefore advertises the production sitemap, tolerated because previews
sit behind Cloudflare Access. Do not give the build step the override without checking the value for production,
which shares that build path.

**The rest of `[env.development.vars]` is load-bearing on every preview.** `--var` merges rather than replaces, so
`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXTJS_ENV` and `TURSO_DATABASE_URL` reach every per-PR worker straight from
`wrangler.toml`, and its `NEXT_PUBLIC_SITE_URL` is what a hand-run `wrangler deploy --env development` advertises.

**The Worker secrets ride the deploy** through `--secrets-file`, written under `$RUNNER_TEMP` and removed in an
`if: always()` step. The upload is additive: a secret the file omits is not deleted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
