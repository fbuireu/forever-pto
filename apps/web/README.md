<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/static/images/forever-pto-logo-dark.png">
  <img src="public/static/images/forever-pto-logo.png" alt="" width="72" align="center">
</picture>

# forever-pto

**The planner.** Next.js 16 on Cloudflare Workers through OpenNext.

**[forever-pto.com](https://forever-pto.com)** · **[Repository README](../../README.md)** · **[Agent guide](./CLAUDE.md)** · **[Glossary](../../CONTEXT.md)**

</div>

---

## What it does

Given a Country, an optional Region, a year and a PTO budget, it finds the Bridges that turn that budget
into the longest stretches away from work, and reports how well it did. The whole planner runs in the
browser ([ADR 0001](../../adr/0001-planner-runs-in-the-browser.md)); the server holds payment and contact
records and nothing else.

## Running it

From the repository root, where every command below also exists as a passthrough:

```bash
pnpm install          # installs the whole workspace, never filtered
pnpm dev              # next dev --turbopack
pnpm build            # next build
pnpm preview          # the real Workers runtime, via OpenNext
```

Or from this directory with `pnpm <script>` directly. Copy `.env.example` to `.env.development` and fill
it in; Worker secrets for a local run go in `.dev.vars`.

**Node 26.3.0 and pnpm 11.21.0 are pinned and must match exactly.** So are Next 16.2 and TypeScript 6,
as a pair, by the Cloudflare adapter — see [ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md)
before raising either.

## Layout

```
src/
  middleware.ts       locale + country cookies, markdown rewrite
  app/                App Router: [locale] pages, api/ handlers, sitemap, robots
  application/        use-cases, DTOs, Zustand stores, export, email templates
  domain/             calendar/ (the pure planning engine) and payment/
  infrastructure/     everything outbound: clients, services, workers, proxy
  ui/                 adapters, hooks, i18n, modules, styles, assets
e2e/                  Playwright specs
workers/tail/         the tail consumer Worker, with its own wrangler.toml
```

Twenty-one folders under `src/` carry their own `CLAUDE.md`. They are the detail; start from
[`CLAUDE.md`](./CLAUDE.md), which indexes them and states the rules for changing anything here.

## Testing

```bash
pnpm test:ut          # 1770 unit tests, co-located with the code
pnpm test:coverage    # the same, with coverage
pnpm test:e2e         # Playwright, against BASE_URL
```

The end-to-end suite runs against a deployed preview, not a local server. `not-found.spec.ts` is
load-bearing: `/_not-found` is the only page rendered per request, so it is the only one that catches the
Worker failing to boot.

## Releasing

This package versions itself: tags are `web-vX.Y.Z`, and a commit belongs to it if it touches
`apps/web/`. The release runs after the production deploy, so a tag means the version is live. See
[ADR 0011](../../adr/0011-per-package-versioning-with-a-bridge-tag.md).

`version` in `package.json` is read at runtime by seven source files to render the footer, the hero, the
error page, the `/api/markdown` output and the `.well-known` agent-skills index — and by the docs site
for its header badge. It is not only a release number.
