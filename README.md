# Forever PTO

**Maximize your time off.** Forever PTO helps you strategically combine vacation days with public holidays to get the most out of every PTO day you have.

→ **[forever-pto.com](https://forever-pto.com)**

---

## What it does

Given your country, region, year, and number of PTO days, Forever PTO suggests the optimal way to place your vacation days so you get the longest possible stretches of time off — automatically accounting for weekends and public holidays.

**Three strategies:**
- **Grouped** — consolidate days into a few long vacations
- **Optimized** — maximize the total number of days off
- **Balanced** — a mix of both

**Beyond scheduling:**
- Edit, delete, or add custom holidays
- See efficiency stats (performance gain, long weekends, work streaks)
- PTO accrual calculator, PTO vs salary calculator, workday counter
- Charts and yearly summary
- Premium features for advanced analysis

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand |
| i18n | next-intl — en, es, ca, it |
| Database | Turso (serverless SQLite) |
| Payments | Stripe |
| Email | Resend |
| Auth | Cloudflare Access + jose |
| Deployment | Cloudflare Workers via OpenNextJS |
| Monitoring | BetterStack |
| Testing | Vitest + Playwright |
| Linting | Biome |

---

## Getting started

**Requirements:** Node.js ≥ 24, pnpm 10

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
pnpm test:e2e         # E2E tests (Playwright)

pnpm lint:all:fix     # Fix all lint issues
pnpm format:all       # Format all files
```

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `RESEND_API_KEY` | Resend API key |
| `JWT_SECRET` | JWT signing secret |
| `CF_ACCESS_TEAM_DOMAIN` | Cloudflare Access team domain |
| `CF_ACCESS_WORKERS_AUD` | CF Access AUD for workers.dev |
| `CF_ACCESS_PREVIEW_AUD` | CF Access AUD for preview URLs |

---

## Contributing

- [Open a feature request](https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement)
- [Report a bug](https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml)
- [Start a discussion](https://github.com/fbuireu/forever-pto/discussions)

Conventional commits required. Run `pnpm prepare` to set up git hooks.

---

## License

Private — © Ferran Buireu
