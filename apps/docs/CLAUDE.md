# apps/docs

## Purpose

The Forever PTO documentation wiki (docs.forever-pto.com). An Astro Starlight site that documents the app end-to-end and renders the **real** design-system components as React islands, styled by the app's own tokens.

## Boundaries

- Independent workspace package (`forever-pto-docs`) with its own CI (`.github/workflows/docs.yml`) and Cloudflare Worker (static assets). It never imports app code as a workspace dependency — only raw sources via the `@ui` alias (vite + tsconfig paths).
- Only Next-free modules may be imported into demos. Anything touching `next/*`, `next-themes`, `@application`, `@domain` or `@infrastructure` is reference-only: document it, do not import it.
- **A component that needs an app context gets the context, not a note saying it cannot be rendered.** Demos already wrap in `LazyMotionProvider` because every `m.*` consumer needs it; `DemoIntlProvider` is the same move for the one `next-intl` consumer in `core/` — `SlidingNumber`, which reads the locale to pick its decimal separator, and `Counter`, which wraps it. Both would otherwise throw during prerender, since `client:visible` still renders on the server. Add a provider here rather than deleting the demo.
- Never import `src/ui/styles/index.css` (double preflight + layer collision with Starlight). The allowed style imports live in `src/styles/global.css` and are ordered deliberately — read its header comment before touching it.

## Conventions

- **Anti-drift rule**: prose names a file, never a volatile literal. Where the app exports a constant (cookie names, enums, CVA objects), import it into the MDX/demo and interpolate; component variant tables are typed `Record`s over `VariantProps<typeof xxxVariants>` so renames break `astro check`. Token values render through the runtime visualizers (`TokenSwatch`, `ShadowScale`, `TypeSpecimen`).
- Demos live in `src/components/demos/`, wrapped in `<Demo>` and hydrated with `client:visible`. Motion-based components need `<LazyMotionProvider>`.
- Content lives in `src/content/docs/` (root locale = English, pathless URLs). `es/` mirrors filenames; untranslated pages fall back to English automatically. Sidebar order via `sidebar.order` frontmatter.
- Formatting/linting: root Biome config (docs is not excluded; only `docs/src/styles` is, for Tailwind directives). No Prettier.
- **Commits touching docs use the `docs:` type** — the repo squash-merges and the PR title becomes the commit on main, so a `feat:`/`fix:` title would cut an app release. See `/contributing/conventions/`.

## Deploy

Two wrangler environments, the same shape the app uses. `[assets]` is declared once at the top level and both inherit it; only `name` and the route differ.

- **main**: `deploy --env production` → `forever-pto-docs`, bound to docs.forever-pto.com. The route is `custom_domain = true`, so wrangler provisions the DNS record and the certificate in the forever-pto.com zone itself — there is nothing to configure in the dashboard.
- **PRs**: `deploy --env development --name pr-<n>-forever-pto-docs-development` → one Worker per pull request at `pr-<n>-forever-pto-docs-development.fbuireu.workers.dev`. The `--name` override is what mints a fresh Worker instead of updating the stable one, so two open PRs never overwrite each other's preview.
- **`cleanup-development.yml` deletes it when the PR closes**, in a job of its own beside the app's. A per-PR Worker that nothing tears down accumulates forever.
- **Previews never touch the production Worker**, which is the whole point of the development environment: it carries no custom domain, so a preview cannot answer on docs.forever-pto.com.
- The four GitHub environments are split per package: this site uses `docs-production` and `docs-development`, and carries no configuration in either — the Cloudflare credentials are repository-level secrets.
