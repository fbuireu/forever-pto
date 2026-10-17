<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/static/images/forever-pto-logo-dark.png">
  <img src="apps/web/public/static/images/forever-pto-logo.png" alt="" width="80" align="center">
</picture>

# Forever PTO

**Maximize your time off. Forever PTO helps you strategically combine your PTO days with public holidays to get the most out of every one of them.**

[![CI](https://img.shields.io/github/actions/workflow/status/fbuireu/forever-pto/ci.yml?style=flat-square&logo=github&label=CI)](https://github.com/fbuireu/forever-pto/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/gh/fbuireu/forever-pto?style=flat-square&logo=codecov)](https://codecov.io/gh/fbuireu/forever-pto)
[![Uptime](https://uptime.betterstack.com/status-badges/v1/monitor/272ww.svg)](https://uptime.betterstack.com/?utm_source=status_badge)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue?style=flat-square)](./LICENSE)

**[forever-pto.com](https://forever-pto.com)** · **[Documentation](https://docs.forever-pto.com)** · **[Getting Started](#getting-started)** · **[Stack](#stack)** · **[Contributing](.github/CONTRIBUTING.md)**

</div>

---

## What it does

Given your country, region, year, and number of PTO days, Forever PTO suggests the optimal way to place your PTO days so you get the longest possible stretches of time off, automatically accounting for weekends and public holidays.

**Strategies:**

- **Grouped**: consolidate days into a few long vacations of about two weeks
- **Optimized**: maximize the total number of days off
- **Balanced**: a long weekend every few weeks, so you never work too long without rest
- **Main vacation**: one long trip of up to two weeks in the months you pick, then the best bridges for the rest

**Beyond scheduling:**

- Edit, delete, or add custom holidays
- See efficiency stats (efficiency, gain, long weekends, max work streak)
- PTO accrual calculator, PTO vs salary calculator, workday counter
- Charts and yearly summary
- Premium features for advanced analysis

---

## Wiki

The full wiki lives at **[docs.forever-pto.com](https://docs.forever-pto.com)**: architecture, runtime flows (planner recalculation, holidays, premium, country detection…), the design system with live component demos, and the CI/CD guide, which starts at [workflows](https://docs.forever-pto.com/infra/workflows/) and covers every job, the environments, the secrets and variables, the rulesets and the releases.

This repo is a workspace holding the app in [`apps/web/`](apps/web) (`forever-pto-web`) and the docs site in [`apps/docs/`](apps/docs) (`forever-pto-docs`, Astro Starlight), which reuses the app's real components and tokens and deploys independently. Each versions itself: a commit is attributed to whichever package its paths fall under, so keep a pull request to one package.

```bash
pnpm --filter forever-pto-docs dev   # docs dev server
```

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js (App Router) + React |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| i18n | next-intl: en, es, ca, it, de, fr |
| Database | Turso (serverless SQLite) |
| Payments | Stripe |
| Email | Resend |
| Premium session | `jose`: a signed, HTTP-only JWT cookie; there are no accounts |
| Deployment | Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`) |
| Monitoring | BetterStack |
| Testing | Vitest + Playwright |
| Linting | Biome |

---

## Getting started

**Requirements:** Node.js at the version [`.nvmrc`](.nvmrc) declares (mirrored in `engines.node`) and pnpm, at the version `packageManager` declares; both are exact pins, so match them exactly. No version is repeated here: the manifests are the only copy Renovate keeps current

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp apps/web/.env.example apps/web/.env.development

# Start dev server
pnpm dev
```

---

## Scripts

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # next build, the Next.js production build
pnpm cf:build         # The Cloudflare Workers build through OpenNext, the one CI deploys
pnpm preview          # Local Cloudflare Workers preview

pnpm test:ut          # Unit tests
pnpm test:docs        # Docs ⟷ code consistency (also runs inside test:ut)
pnpm test:e2e         # E2E tests (Playwright)

pnpm lint:all:fix     # Fix all lint issues
pnpm format:all       # Format all files
```

There is no deploy script. The app deploys from CI alone: a push to `main` builds, deploys, smoke-tests and
releases it, and a manual run of the [CI workflow](https://github.com/fbuireu/forever-pto/actions/workflows/ci.yml)
redeploys production. A local `opennextjs-cloudflare deploy` without `--env` would put a laptop build on the
production Worker without its route or its environment variables; [`AGENTS.md`](AGENTS.md) says why.

---

## Environment variables

Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.development` for `pnpm dev`.
`pnpm preview` runs the real Workers runtime, which reads the server-side values from `apps/web/.dev.vars`
instead: same keys, gitignored.

| Variable | Deployed as | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | GitHub environment variable, inlined at build | Stripe's publishable key; a production build refuses one that does not start with `pk_` |
| `NEXT_PUBLIC_STORAGE_KEY` | GitHub environment variable, inlined at build | The key the stores obfuscate `localStorage` with; a production build refuses an empty one |
| `STRIPE_SECRET_KEY` | Worker secret | Stripe's secret key |
| `STRIPE_WEBHOOK_SECRET` | Worker secret | Verifies the Stripe webhook's signature |
| `RESEND_API_KEY` | Worker secret | Sends the contact email |
| `JWT_SECRET` | Worker secret | Signs the Premium session cookie |
| `TURSO_AUTH_TOKEN` | Worker secret | Turso's auth token |
| `TURSO_DATABASE_URL` | A `wrangler.toml` var per environment, not a secret | The Turso database for that environment |

Every secret and variable CI reads, with where it lives and what breaks without it, is the
[secrets matrix](https://docs.forever-pto.com/infra/secrets/).

---

## Documentation

| Document | What it answers |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | How the repository is put together, and what a change has to carry. Start here |
| [The wiki's architecture overview](https://docs.forever-pto.com/architecture/overview/) | How the app is layered, measured from the imports, and where each request goes; there is no `ARCHITECTURE.md` |
| [The CI/CD guide](https://docs.forever-pto.com/infra/workflows/) | Every workflow, deploy, check and release, the secrets matrix and the rulesets |
| [`CODING_STANDARDS.md`](CODING_STANDARDS.md) | How code here is written: the rules a review holds a diff to |
| [`apps/web/README.md`](apps/web/README.md) | The planner: what it does, how to run it, how it releases |
| [`apps/docs/README.md`](apps/docs/README.md) | The wiki: how to run it, and how to write a page |
| [`GLOSSARY.md`](GLOSSARY.md) | The domain glossary: one canonical name per concept |
| [`docs/adr/`](docs/adr) | Why it is like this. One hard-to-reverse decision per file |

**The architecture is domain-driven in its strategic half and deliberately not in its tactical half.** The
glossary rules the names, the bounded contexts and the layer boundaries are constraints, and the
dependency graph is measured rather than drawn; aggregates, repositories, entities and an event bus are all
absent on purpose. Which practices are taken, which are taken in part and which are rejected, with the reason
for each and worked examples from this tree, is
[ADR 0014](docs/adr/0014-ddd-where-it-pays.md). Read it before proposing that anything here be "finished".

Selected folders under [`apps/web/src/`](./apps/web/src) carry their own `AGENTS.md` with the detail for that folder: the layer roots plus their sub-folders, all listed in [`apps/web/AGENTS.md`](apps/web/AGENTS.md).
[`tests/docs-consistency.test.ts`](tests/docs-consistency.test.ts) runs with the unit suite and fails the build
when the docs and the code disagree.

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for setup, checks and conventions,
and the [Code of Conduct](.github/CODE_OF_CONDUCT.md). Security issues follow the
[Security Policy](.github/SECURITY.md), never a public issue.

- [Open a feature request](https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement)
- [Report a bug](https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml)
- [Start a discussion](https://github.com/fbuireu/forever-pto/discussions)

Conventional commits required. Run `pnpm prepare` to set up git hooks.

---

## License

[AGPL-3.0-only](./LICENSE) © Ferran Buireu

Running a modified copy as a network service obliges you to offer its source to the people using it.