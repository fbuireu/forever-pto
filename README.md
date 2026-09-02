<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/static/images/forever-pto-logo-dark.png">
  <img src="apps/web/public/static/images/forever-pto-logo.png" alt="" width="80" align="center">
</picture>

# Forever PTO

**Maximize your time off. Forever PTO helps you strategically combine your PTO days with public holidays to get the most out of every one of them.**

[![CI](https://img.shields.io/github/actions/workflow/status/fbuireu/forever-pto/ci.yml?style=flat-square&logo=github&label=CI)](https://github.com/fbuireu/forever-pto/actions/workflows/ci.yml)
[![Uptime](https://uptime.betterstack.com/status-badges/v1/monitor/272ww.svg)](https://uptime.betterstack.com/?utm_source=status_badge)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue?style=flat-square)](./LICENSE)

**[forever-pto.com](https://forever-pto.com)** · **[Documentation](https://docs.forever-pto.com)** · **[Getting Started](#getting-started)** · **[Stack](#stack)** · **[Contributing](./CONTRIBUTING.md)**

</div>

---

## What it does

Given your country, region, year, and number of PTO days, Forever PTO suggests the optimal way to place your PTO days so you get the longest possible stretches of time off, automatically accounting for weekends and public holidays.

**Three strategies:**

- **Grouped**: consolidate days into a few long vacations
- **Optimized**: maximize the total number of days off
- **Balanced**: a mix of both

**Beyond scheduling:**

- Edit, delete, or add custom holidays
- See efficiency stats (efficiency, gain, long weekends, max work streak)
- PTO accrual calculator, PTO vs salary calculator, workday counter
- Charts and yearly summary
- Premium features for advanced analysis

---

## Documentation

The full wiki lives at **[docs.forever-pto.com](https://docs.forever-pto.com)**: architecture, runtime flows (country detection, premium, holidays engine…), the design system with live component demos, and the complete CI/CD and environments lifecycle.

This repo is a workspace with two packages: the app in [`apps/web/`](apps/web/) (`forever-pto`) and the docs site in [`apps/docs/`](apps/docs/) (`forever-pto-docs`, Astro Starlight), which reuses the app's real components and tokens and deploys independently. Each versions itself: a commit is attributed to whichever package its paths fall under, so keep a pull request to one package.

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
| Deployment | Cloudflare Workers via OpenNextJS |
| Monitoring | BetterStack |
| Testing | Vitest + Playwright |
| Linting | Biome |

---

## Getting started

**Requirements:** Node.js at the version [`.nvmrc`](./.nvmrc) declares (mirrored in `engines.node`) and pnpm, at the version `packageManager` declares; both are exact pins, so match them exactly. No version is repeated here: the manifests are the only copy Renovate keeps current

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
pnpm build            # Production build
pnpm deploy           # Build + deploy to Cloudflare Workers
pnpm preview          # Local Cloudflare Workers preview

pnpm test:ut          # Unit tests
pnpm test:docs        # Docs ⟷ code consistency (also runs inside test:ut)
pnpm test:e2e         # E2E tests (Playwright)

pnpm lint:all:fix     # Fix all lint issues
pnpm format:all       # Format all files
```

---

## Environment variables

See [`apps/web/.env.example`](apps/web/.env.example) for the full list. Key variables:

| Variable | Description |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `RESEND_API_KEY` | Resend API key |
| `JWT_SECRET` | JWT signing secret |

---

## Documentation

| Document | What it answers |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | How the repository is put together, and the rules for changing it. Start here |
| [`apps/web/README.md`](apps/web/README.md) | The planner: what it does, how to run it, how it releases |
| [`apps/docs/README.md`](apps/docs/README.md) | The wiki: how to run it, and how to write a page |
| [`CONTEXT.md`](CONTEXT.md) | The domain glossary: one canonical name per concept |
| [`adr/`](adr/) | Why it is like this. One hard-to-reverse decision per file |

**The architecture is domain-driven in its strategic half and deliberately not in its tactical half.** The
glossary rules the names, the two bounded contexts and the layer boundaries are constraints, and the
dependency graph is measured rather than drawn; aggregates, repositories, entities and an event bus are all
absent on purpose. Which practices are taken, which are taken in part and which are rejected, with the reason
for each and six worked examples from this tree, is
[ADR 0014](adr/0014-ddd-where-it-pays.md). Read it before proposing that anything here be "finished".

Selected folders under [`apps/web/src/`](./apps/web/src) carry their own `CLAUDE.md` with the detail for that folder: the five layer roots plus sixteen sub-folders, all listed in [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md).
[`tests/docs-consistency.test.ts`](tests/docs-consistency.test.ts) runs with the unit suite and fails the build
when the docs and the code disagree.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, checks and conventions,
and the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues follow the
[Security Policy](./SECURITY.md), never a public issue.

- [Open a feature request](https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement)
- [Report a bug](https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml)
- [Start a discussion](https://github.com/fbuireu/forever-pto/discussions)

Conventional commits required. Run `pnpm prepare` to set up git hooks.

---

## License

[AGPL-3.0-only](./LICENSE) © Ferran Buireu

Running a modified copy as a network service obliges you to offer its source to the people using it.