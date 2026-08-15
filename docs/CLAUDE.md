# docs

## Purpose

The Forever PTO documentation wiki (docs.forever-pto.com). An Astro Starlight site that documents the app end-to-end and renders the **real** design-system components as React islands, styled by the app's own tokens.

## Boundaries

- Independent workspace package (`forever-pto-docs`) with its own CI (`.github/workflows/docs.yml`) and Cloudflare Worker (static assets). It never imports app code as a workspace dependency — only raw sources via the `@ui` alias (vite + tsconfig paths).
- Only Next-free modules may be imported into demos. Anything touching `next/*`, `next-intl`, `next-themes`, `@application`, `@domain` or `@infrastructure` is reference-only: document it, do not import it.
- Never import `src/ui/styles/index.css` (double preflight + layer collision with Starlight). The allowed style imports live in `src/styles/global.css` and are ordered deliberately — read its header comment before touching it.

## Conventions

- **Anti-drift rule**: prose names a file, never a volatile literal. Where the app exports a constant (cookie names, enums, CVA objects), import it into the MDX/demo and interpolate; component variant tables are typed `Record`s over `VariantProps<typeof xxxVariants>` so renames break `astro check`. Token values render through the runtime visualizers (`TokenSwatch`, `ShadowScale`, `TypeSpecimen`).
- Demos live in `src/components/demos/`, wrapped in `<Demo>` and hydrated with `client:visible`. Motion-based components need `<LazyMotionProvider>`.
- Content lives in `src/content/docs/` (root locale = English, pathless URLs). `es/` mirrors filenames; untranslated pages fall back to English automatically. Sidebar order via `sidebar.order` frontmatter.
- Formatting/linting: root Biome config (docs is not excluded; only `docs/src/styles` is, for Tailwind directives). No Prettier.
- **Commits touching docs use the `docs:` type** — the repo squash-merges and the PR title becomes the commit on main, so a `feat:`/`fix:` title would cut an app release. See `/contributing/conventions/`.

## Deploy

- PRs: `wrangler versions upload --preview-alias pr-<n>` → deterministic preview URL on workers.dev; versions are immutable, no teardown exists or is needed.
- main: `wrangler deploy` → docs.forever-pto.com (custom domain declared in `wrangler.toml`).
- Bootstrap: `versions upload` cannot create the Worker, so the preview job probes with `versions list` and skips gracefully until the first production deploy has created `forever-pto-docs` (done 2026-07-12).
