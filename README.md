# Forever PTO

**Maximize your time off.** Forever PTO helps you strategically combine your PTO days with public holidays to get the most out of every one of them.

→ **[forever-pto.com](https://forever-pto.com)** · **[docs.forever-pto.com](https://docs.forever-pto.com)** (wiki)

---

## What it does

Given your country, region, year, and number of PTO days, Forever PTO suggests the optimal way to place your PTO days so you get the longest possible stretches of time off — automatically accounting for weekends and public holidays.

**Three strategies:**

- **Grouped** — consolidate days into a few long vacations
- **Optimized** — maximize the total number of days off
- **Balanced** — a mix of both

**Beyond scheduling:**

- Edit, delete, or add custom holidays
- See efficiency stats (efficiency, gain, long weekends, max work streak)
- PTO accrual calculator, PTO vs salary calculator, workday counter
- Charts and yearly summary
- Premium features for advanced analysis

---

## Documentation

The full wiki lives at **[docs.forever-pto.com](https://docs.forever-pto.com)** — architecture, runtime flows (country detection, premium, holidays engine…), the design system with live component demos, and the complete CI/CD and environments lifecycle.

This repo is a pnpm workspace: the app at the root (`forever-pto`) and the docs site in [`docs/`](docs/) (`forever-pto-docs`, Astro Starlight), which reuses the app's real components and tokens and deploys independently. Docs-only changes must use `docs:` commit/PR titles (squash-merge feeds semantic-release).

```bash
pnpm --filter forever-pto-docs dev   # docs dev server
```

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand |
| i18n | next-intl — en, es, ca, it, de, fr |
| Database | Turso (serverless SQLite) |
| Payments | Stripe |
| Email | Resend |
| Premium session | `jose` — a signed, HTTP-only JWT cookie; there are no accounts |
| Deployment | Cloudflare Workers via OpenNextJS |
| Monitoring | BetterStack |
| Testing | Vitest + Playwright |
| Linting | Biome |

---

## Getting started

**Requirements:** Node.js 26.3.0 (`.nvmrc`, mirrored in `engines.node`), pnpm 11.20.0 (`packageManager`) — pinned, match exactly

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env.development

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

See [`.env.example`](.env.example) for the full list. Key variables:

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
| [`CLAUDE.md`](CLAUDE.md) | How the codebase is built, and the rules for changing it. Start here |
| [`CONTEXT.md`](CONTEXT.md) | The domain glossary — one canonical name per concept |
| [`docs/adr/`](docs/adr/) | Why it is like this. One hard-to-reverse decision per file |

Selected folders under `src/` carry their own `CLAUDE.md` with the detail for that folder — the five layer roots plus sixteen sub-folders, all listed in the root [`CLAUDE.md`](CLAUDE.md).
[`docs/docs-consistency.test.ts`](docs/docs-consistency.test.ts) runs with the unit suite and fails the build
when the docs and the code disagree.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, checks and conventions,
and the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues follow the
[Security Policy](./SECURITY.md) — never a public issue.

- [Open a feature request](https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement)
- [Report a bug](https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml)
- [Start a discussion](https://github.com/fbuireu/forever-pto/discussions)

Conventional commits required. Run `pnpm prepare` to set up git hooks.

---

## License

Private — © Ferran Buireu

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/272ww.svg)](https://uptime.betterstack.com/?utm_source=status_badge)