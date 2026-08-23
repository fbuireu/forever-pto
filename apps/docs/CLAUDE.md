# apps/docs

## Purpose

The Forever PTO documentation wiki (docs.forever-pto.com). An Astro Starlight site that documents the app end-to-end and renders the **real** design-system components as React islands, styled by the app's own tokens.

## Boundaries

- Independent workspace package (`forever-pto-docs`) with its own CI ([`.github/workflows/docs.yml`](../../.github/workflows/docs.yml)) and Cloudflare Worker (static assets). It never imports app code as a workspace dependency, only raw sources. Most of that goes through the `@ui` alias, but **not all of it**. Four other things reach across:
  - [`HowItWorksDemo.tsx`](./src/components/demos/HowItWorksDemo.tsx) imports `FilterStrategy` from `apps/web/src/domain/calendar/types.ts` and `LOCALES` from `apps/web/src/infrastructure/i18n/locales.ts`, both by relative path.
  - [`src/lib/app-version.ts`](./src/lib/app-version.ts) reads [`apps/web/package.json`](../web/package.json) for the version the site displays.
  - [`src/styles/global.css`](./src/styles/global.css) `@import`s **three** stylesheets from `apps/web/src/ui/styles`: `theme/index.css`, `global/index.css` and `utilities/index.css`.
  - Its two `@source` directives point somewhere else again: at `apps/web/src/ui/modules/core` and at `apps/web/src/ui/modules/pages/homepage/sections/shared.ts`, so Tailwind generates the utilities those files name.

  [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) derives that whole reach from the sources and asserts every path of it appears in `docs.yml`'s triggers, so a new import that the docs workflow would not rebuild on fails the app's own suite. It scans the **whole package**, not just `src/`; [`astro.config.ts`](./astro.config.ts) and [`tsconfig.json`](./tsconfig.json) are where the seam is declared and were outside the old scope.

  **That rule proves the docs workflow rebuilds on a change over there, not that the target still exists**, and `astro check` cannot help: it does not read CSS. A second rule resolves all five relative reaches against the tree. A renamed `@import` target at least fails `astro build`, loudly but late, in the Docs workflow after the app's own CI has gone green; a renamed `@source` target fails nothing at all, because Tailwind extracts no class from a path that matches nothing, so the build stays green and the demos ship unstyled, which [`e2e/demos.spec.ts`](./e2e/demos.spec.ts) cannot see because it asserts a 200, a child count and a silent console.
- **The four font families are spelled in three places and only two of them are tied.** [`apps/web/src/app/fonts.ts`](../web/src/app/fonts.ts) is the source of truth: `next/font/google` registers `--font-bricolage`, `--font-space-grotesk`, `--font-instrument-serif` and `--font-jetbrains-mono`, and the app's `theme/index.css`, imported above, points `--font-sans` and its siblings at those names. There is no Next here to inject them, so [`src/styles/global.css`](./src/styles/global.css) declares the same four in `:root` over the self-hosted `@fontsource` faces. Swap a family in the app and the role token points at a variable this site never defines, so the wiki renders in the browser default while the specimen beside it still names the old family. The contract suite asserts every registered variable is declared here. The third spelling is `TypeSpecimen`'s human-readable `label`, which stays prose; nothing mechanises that half.
- **The `@ui` alias is declared once, in [`tsconfig.json`](./tsconfig.json), and `astro.config.ts` derives the vite alias from it.** Both files resolve against this directory, so the string needs no adjustment; it was spelled in both, plus twice more inside the contract suite, with nothing comparing them. Move the app's UI layer and there is one line to change.
- **What this package reaches into the app for is what `docs.yml` has to trigger on.** Today that is all of `src/ui/`, plus [`src/domain/calendar/types.ts`](../web/src/domain/calendar/types.ts) and [`src/infrastructure/i18n/locales.ts`](../web/src/infrastructure/i18n/locales.ts), which `HowItWorksDemo` imports by relative path. Reaching for a new app module means adding its path to both trigger blocks, or a rename over there merges green and breaks the site here.
- Only Next-free modules may be imported into demos. Anything touching `next/*`, `next-themes`, `@application`, `@domain` or `@infrastructure` is reference-only: document it, do not import it.
- **A component that needs an app context gets the context, not a note saying it cannot be rendered, and `Demo` supplies it, so no demo has to remember.** `LazyMotionProvider` is needed by every `m.*` consumer and `DemoIntlProvider` by the `next-intl` ones in `core/`: `SlidingNumber`, which reads the locale to pick its decimal separator, and `Counter`, which wraps it. Both would otherwise throw during prerender, since `client:visible` still renders on the server.

  Fifteen of the 32 demos used to wrap `LazyMotionProvider` themselves and two also wrapped the intl one, with this bullet as the only thing telling the sixteenth author to do the same; and forgetting does not fail typecheck, it fails the build, in the other workflow. `Demo` composes both around the frame now. The cost is nil: `LazyMotion` with `domAnimation` is lazy by construction and `NextIntlClientProvider` with empty messages is inert for anything that does not consume it. Add a provider **here** rather than at a demo.
- Never import [`src/ui/styles/index.css`](../web/src/ui/styles/index.css) (double preflight + layer collision with Starlight). The allowed style imports live in `src/styles/global.css` and are ordered deliberately; read its header comment before touching it.

## Conventions

- **Anti-drift rule**: prose names a file, never a volatile literal. Where the app exports a constant (cookie names, enums, CVA objects), import it into the MDX/demo and interpolate; component variant tables are typed `Record`s over `VariantProps<typeof xxxVariants>` so renames break `astro check`. Token values render through the runtime visualizers (`TokenSwatch`, `ShadowScale`, `TypeSpecimen`).
- Demos live in [`src/components/demos/`](./src/components/demos), wrapped in `<Demo>` and hydrated with `client:visible`. Motion-based components need `<LazyMotionProvider>`.
- **`Demo` marks its frame with `data-demo`, and [`e2e/demos.spec.ts`](./e2e/demos.spec.ts) walks every page that carries one.** The
  list is derived from `dist/**/index.html` after the build, not from the MDX sources, because the source
  question ("does this file import from `components/demos/`?") answers yes for a page that merely names the
  folder in prose and for one that imports a plain constant like `APP_LOCALES`. The built HTML is what is
  actually served. Sixty-five tests cover 64 pages plus a floor assertion, so a build that stops emitting
  demos fails rather than passing with an empty list.

  Each page is asserted three ways: it answers 200, every `data-demo` frame has at least one element child
  once scrolled into view, and the page raises no `pageerror` and logs no `console.error`. That third one is
  the point: **a demo can break in the browser and build green.** A `useEffect` that throws was used to
  verify it: `astro build` reported 155 pages built, and the suite went red. Asserting on *text* instead does
  not work, and was the first attempt: an `Input` or `Slider` demo legitimately renders no text at all.

  **`test:e2e` does not build, and it needs the build.** `astro preview` serves `dist`, it does not produce it, and
  the page list is read off `dist` while the spec file is being collected, so a clean checkout died with
  `ENOENT ... scandir dist` before a single test was reported, and the preview server's own failure named nothing.
  [`playwright.config.ts`](./playwright.config.ts) checks for `dist` when it loads, which is before the web server
  starts and before any spec is collected, and throws a message naming the build command. CI already builds first,
  so making the script build would have built the site twice per run.

  **Under a coding agent, `astro preview` puts itself in the background**, because Astro 7 routes the command
  through `am-i-vibing` and switches to a daemon plus JSON logs when it detects one. The foreground process then
  exits at once and Playwright reports `Process from config.webServer exited early`. Run it a second time, which
  reuses the daemon, or `pnpm exec astro preview stop` first. A stale daemon started before a rebuild serves the
  previous HTML against the new assets, which shows up as a hydration error on one page and nothing else. CI is
  unaffected: no agent is detected there, so the server stays in the foreground.
- Content lives in [`src/content/docs/`](./src/content/docs) (root locale = English, pathless URLs). `es/` mirrors filenames; untranslated pages fall back to English automatically. Sidebar order via `sidebar.order` frontmatter.
- Formatting/linting: root Biome config (docs is not excluded; only [`apps/docs/src/styles`](./src/styles) is, for Tailwind directives). No Prettier. **This package carries no Biome scripts of its own.** It used to carry eight, a character-for-character copy of the root manifest's, and nothing ran them: `lint-staged` calls the root script and `docs.yml` runs `typecheck`, `build` and `test:e2e`. Two were actively wrong, because `--changed` means "changed against `main`" and needs the git root to compare against. What is left is `dev`, `build`, `preview`, `deploy`, `upload`, `typecheck` and `test:e2e`.
- **[`src/content/i18n/es.json`](./src/content/i18n/es.json) holds only strings this site really changes.** Starlight ships its own Spanish bundle, and an override restating it byte for byte is worse than none: it pins a value upstream may correct and it buries the ones that are deliberate. Four keys are left, all shortenings that fit the chrome: `themeSelect.auto`, `page.editLink`, `page.previousLink` and `page.nextLink`. `search.ctrlKey` is why the rule exists. It read `Ctrl K`, and Starlight's search button renders `<kbd>{ctrlKey}</kbd><kbd>K</kbd>`, so all 76 Spanish pages shipped a search box reading `Ctrl K K`. The contract suite compares every key against the vendor bundle in `node_modules` and fails on an identical one.
- **Every sidebar group carries its `translations: { es }`, the nested ones included.** The four under "Design system" did not, so a Spanish visitor read four English labels inside an otherwise Spanish sidebar. "Design system" itself stays untranslated on purpose.
- **Commits touching docs use the `docs:` type**: the repo squash-merges and the PR title becomes the commit on main, so a `feat:`/`fix:` title would cut an app release. See `/contributing/conventions/`.

## Deploy

Two wrangler environments, the same shape the app uses. `[assets]` is declared once at the top level and both inherit it. **`name` does not differ between the top level and production**: both are `forever-pto-docs`, and what production actually overrides is the route plus the two exposure flags.

- **main**: `deploy --env production` → `forever-pto-docs`, bound to docs.forever-pto.com. The route is `custom_domain = true`, so wrangler provisions the DNS record and the certificate in the forever-pto.com zone itself; there is nothing to configure in the dashboard.
- **PRs**: `deploy --env development --name pr-<n>-forever-pto-docs-development` → one Worker per pull request at `pr-<n>-forever-pto-docs-development.fbuireu.workers.dev`. The `--name` override is what mints a fresh Worker instead of updating the stable one, so two open PRs never overwrite each other's preview.
- **[`cleanup-development.yml`](../../.github/workflows/cleanup-development.yml) deletes it when the PR closes**, in a job of its own beside the app's. A per-PR Worker that nothing tears down accumulates forever.
- **Previews never touch the production Worker**, which is the whole point of the development environment: it carries no custom domain, so a preview cannot answer on docs.forever-pto.com.
- The four GitHub environments are split per package: this site uses `docs-production` and `docs-development`, and carries none of the app's `NEXT_PUBLIC_*` values in either. It does need the Cloudflare credentials: all three docs jobs declare `environment:` and read `CLOUDFLARE_API_TOKEN` from inside it, so the pair is on the repository guide's setup checklist like the `web-*` two. Only `PAT` and `CODECOV_TOKEN` are repository-level.
- **`workers_dev` and `preview_urls` are inheritable, so production has to refuse them explicitly.** Both are `true` at the top level, which is what a per-PR preview needs and what `[env.development]` therefore inherits rather than restating, and `[env.production]` sets both to `false`. They were inherited, so the published wiki also answered on a `workers.dev` origin, from a `robots.txt` that says `Allow: /`. Starlight emits a correct canonical, so that was hygiene rather than an incident.
- **`pnpm --filter forever-pto-docs deploy` passes no `--env`, so it deploys the top-level config to the live production Worker.** The top level carries production's own `name` with no route block and with `workers_dev = true`, so a local one-shot deploy overwrites docs.forever-pto.com and turns its `workers.dev` origin back on. Run `wrangler deploy --env production`, which is what the workflow runs.
