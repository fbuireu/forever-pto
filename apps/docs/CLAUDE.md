# apps/docs

## Purpose

The Forever PTO documentation wiki (docs.forever-pto.com). An Astro Starlight site that documents the app end-to-end and renders the **real** design-system components as React islands, styled by the app's own tokens.

## Boundaries

- Independent workspace package (`forever-pto-docs`) with its own CI ([`.github/workflows/docs.yml`](../../.github/workflows/docs.yml)) and Cloudflare Worker (static assets). It never imports app code as a workspace dependency — only raw sources. Most of that goes through the `@ui` alias (vite + tsconfig paths), but **not all of it**: [`HowItWorksDemo.tsx`](./src/components/demos/HowItWorksDemo.tsx) reaches `@domain/calendar/types` and `@infrastructure/i18n/locales` by relative path, [`src/lib/app-version.ts`](./src/lib/app-version.ts) reads [`apps/web/package.json`](../web/package.json), and [`src/styles/global.css`](./src/styles/global.css) pulls five stylesheets and two `@source` directives out of `apps/web/src/ui/styles`. [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) derives that whole reach from the sources and asserts every path of it appears in `docs.yml`'s triggers, so a new import that the docs workflow would not rebuild on fails the app's own suite.
- **What this package reaches into the app for is what `docs.yml` has to trigger on.** Today that is all of `src/ui/`, plus [`src/domain/calendar/types.ts`](../web/src/domain/calendar/types.ts) and [`src/infrastructure/i18n/locales.ts`](../web/src/infrastructure/i18n/locales.ts), which `HowItWorksDemo` imports by relative path. Reaching for a new app module means adding its path to both trigger blocks, or a rename over there merges green and breaks the site here.
- Only Next-free modules may be imported into demos. Anything touching `next/*`, `next-themes`, `@application`, `@domain` or `@infrastructure` is reference-only: document it, do not import it.
- **A component that needs an app context gets the context, not a note saying it cannot be rendered — and `Demo` supplies it, so no demo has to remember.** `LazyMotionProvider` is needed by every `m.*` consumer and `DemoIntlProvider` by the `next-intl` ones in `core/` — `SlidingNumber`, which reads the locale to pick its decimal separator, and `Counter`, which wraps it. Both would otherwise throw during prerender, since `client:visible` still renders on the server.

  Fifteen of the 32 demos used to wrap `LazyMotionProvider` themselves and two also wrapped the intl one, with this bullet as the only thing telling the sixteenth author to do the same — and forgetting does not fail typecheck, it fails the build, in the other workflow. `Demo` composes both around the frame now. The cost is nil: `LazyMotion` with `domAnimation` is lazy by construction and `NextIntlClientProvider` with empty messages is inert for anything that does not consume it. Add a provider **here** rather than at a demo.
- Never import [`src/ui/styles/index.css`](../web/src/ui/styles/index.css) (double preflight + layer collision with Starlight). The allowed style imports live in `src/styles/global.css` and are ordered deliberately — read its header comment before touching it.

## Conventions

- **Anti-drift rule**: prose names a file, never a volatile literal. Where the app exports a constant (cookie names, enums, CVA objects), import it into the MDX/demo and interpolate; component variant tables are typed `Record`s over `VariantProps<typeof xxxVariants>` so renames break `astro check`. Token values render through the runtime visualizers (`TokenSwatch`, `ShadowScale`, `TypeSpecimen`).
- Demos live in `src/components/demos/`, wrapped in `<Demo>` and hydrated with `client:visible`. Motion-based components need `<LazyMotionProvider>`.
- **`Demo` marks its frame with `data-demo`, and [`e2e/demos.spec.ts`](./e2e/demos.spec.ts) walks every page that carries one.** The
  list is derived from `dist/**/index.html` after the build, not from the MDX sources, because the source
  question — "does this file import from `components/demos/`?" — answers yes for a page that merely names the
  folder in prose and for one that imports a plain constant like `APP_LOCALES`. The built HTML is what is
  actually served. Sixty-three tests cover 62 pages plus a floor assertion, so a build that stops emitting
  demos fails rather than passing with an empty list.

  Each page is asserted three ways: it answers 200, every `data-demo` frame has at least one element child
  once scrolled into view, and the page raises no `pageerror` and logs no `console.error`. That third one is
  the point — **a demo can break in the browser and build green.** A `useEffect` that throws was used to
  verify it: `astro build` reported 155 pages built, and the suite went red. Asserting on *text* instead does
  not work, and was the first attempt: an `Input` or `Slider` demo legitimately renders no text at all.
- Content lives in `src/content/docs/` (root locale = English, pathless URLs). `es/` mirrors filenames; untranslated pages fall back to English automatically. Sidebar order via `sidebar.order` frontmatter.
- Formatting/linting: root Biome config (docs is not excluded; only `apps/docs/src/styles` is, for Tailwind directives). No Prettier.
- **Commits touching docs use the `docs:` type** — the repo squash-merges and the PR title becomes the commit on main, so a `feat:`/`fix:` title would cut an app release. See `/contributing/conventions/`.

## Deploy

Two wrangler environments, the same shape the app uses. `[assets]` is declared once at the top level and both inherit it; only `name` and the route differ.

- **main**: `deploy --env production` → `forever-pto-docs`, bound to docs.forever-pto.com. The route is `custom_domain = true`, so wrangler provisions the DNS record and the certificate in the forever-pto.com zone itself — there is nothing to configure in the dashboard.
- **PRs**: `deploy --env development --name pr-<n>-forever-pto-docs-development` → one Worker per pull request at `pr-<n>-forever-pto-docs-development.fbuireu.workers.dev`. The `--name` override is what mints a fresh Worker instead of updating the stable one, so two open PRs never overwrite each other's preview.
- **[`cleanup-development.yml`](../../.github/workflows/cleanup-development.yml) deletes it when the PR closes**, in a job of its own beside the app's. A per-PR Worker that nothing tears down accumulates forever.
- **Previews never touch the production Worker**, which is the whole point of the development environment: it carries no custom domain, so a preview cannot answer on docs.forever-pto.com.
- The four GitHub environments are split per package: this site uses `docs-production` and `docs-development`, and carries no configuration in either — the Cloudflare credentials are repository-level secrets.
