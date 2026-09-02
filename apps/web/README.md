<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/static/images/forever-pto-logo-dark.png">
  <img src="public/static/images/forever-pto-logo.png" alt="" width="72" align="center">
</picture>

# forever-pto

**The planner.** Next.js on Cloudflare Workers through OpenNext.

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

Or from this directory with `pnpm <script>` directly. Copy [`.env.example`](./.env.example) to `.env.development` and fill
it in; Worker secrets for a local run go in `.dev.vars`.

**Both runtimes are pinned exactly and must match:** Node in [`.nvmrc`](../../.nvmrc), mirrored in
`engines.node`; pnpm, in the root `packageManager`. Next and `@opennextjs/cloudflare` move as a pair, and the
docs package stays on an older TypeScript line than this one; see
[ADR 0009](../../adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md) and [`CLAUDE.md`](./CLAUDE.md) before
raising any of them.

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
pnpm test:ut:coverage    # the same, with coverage
pnpm test:e2e         # Playwright, against BASE_URL
```

The end-to-end suite runs against a deployed preview, not a local server. [`not-found.spec.ts`](./e2e/[locale]/not-found.spec.ts) is
load-bearing: `/_not-found` is the only page rendered per request, so it is the only one that catches the
Worker failing to boot.

## Releasing

This package versions itself: tags are `web-vX.Y.Z`, and a commit belongs to it if it touches
`apps/web/`. The release runs after the production deploy, so a tag means the version is live. See
[ADR 0011](../../adr/0011-per-package-versioning-with-a-bridge-tag.md).

`version` in [`package.json`](./package.json) is read at runtime by six source files to render the footer, the hero, the
error page, the `/api/markdown` output and both `.well-known` documents, the agent-skills index and the MCP
server card, and by the docs site for its header badge. It is not only a release number.
