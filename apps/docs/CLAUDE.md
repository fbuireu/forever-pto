# apps/docs

## Purpose

The Forever PTO documentation wiki (docs.forever-pto.com). An Astro Starlight site that documents the app end-to-end and renders the **real** design-system components as React islands, styled by the app's own tokens.

## Boundaries

- Independent workspace package (`forever-pto-docs`) with its own CI ([`.github/workflows/docs.yml`](../../.github/workflows/docs.yml)) and Cloudflare Worker (static assets). It never imports app code as a workspace dependency, only raw sources. Most of that goes through the `@ui` alias, but **not all of it**. Other things reach across:
  - [`HowItWorksDemo.tsx`](./src/components/demos/HowItWorksDemo.tsx) imports `FilterStrategy` from `apps/web/src/domain/calendar/types.ts` and `LOCALES` from `apps/web/src/infrastructure/i18n/locales.ts`, both by relative path. [`PlanningEngineDemo.tsx`](./src/components/demos/PlanningEngineDemo.tsx) imports `PTO_CONSTANTS` from `apps/web/src/domain/calendar/const.ts` the same way, and renders the tunables table through a `Record` that is exhaustive over every leaf of that object, so a tunable added or renamed in the engine fails `astro check` here until its row is written.
  - [`src/lib/app-version.ts`](./src/lib/app-version.ts) reads [`apps/web/package.json`](../web/package.json) for the version the site displays.
  - [`src/styles/global.css`](./src/styles/global.css) `@import`s **app** stylesheets from `apps/web/src/ui/styles`: `theme/index.css`, `global/index.css` and `utilities/index.css`.
  - Its `@source` directives point somewhere else again: at `apps/web/src/ui/modules/core` and at `apps/web/src/ui/modules/pages/homepage/sections/shared.ts`, so Tailwind generates the utilities those files name.

  [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) derives that whole reach from the sources and asserts every path of it appears in `docs.yml`'s triggers, so a new import that the docs workflow would not rebuild on fails the app's own suite. It scans the **whole package**, not just `src/`; [`astro.config.ts`](./astro.config.ts) and [`tsconfig.json`](./tsconfig.json) are where the seam is declared and were outside the old scope.

  **That rule proves the docs workflow rebuilds on a change over there, not that the target still exists**, and `astro check` cannot help: it does not read CSS. A second rule resolves every relative reach against the tree. A renamed `@import` target at least fails `astro build`, loudly but late, in the Docs workflow after the app's own CI has gone green; a renamed `@source` target fails nothing at all, because Tailwind extracts no class from a path that matches nothing, so the build stays green and the demos ship unstyled, which [`e2e/demos.spec.ts`](./e2e/demos.spec.ts) cannot see because it asserts a 200, a child count and a silent console.

  **[`e2e/tailwind-sources.spec.ts`](./e2e/tailwind-sources.spec.ts) is what sees it, and the reason it needed writing is that a case which looks like it already did cannot.** `docs.spec.ts`'s *Button island hydrates and lifts on hover with app tokens* asserts the demoed `Button` has a `box-shadow`, which reads as proof that the app's own utilities arrived; it is not. `shadow-[var(--shadow-brutal-btn)]` is also written out in [`src/components/demos/HitAreaDemo.tsx`](./src/components/demos/HitAreaDemo.tsx), inside this package, so Tailwind generates that rule from the docs root whatever the `@source` does. Verified by renaming both directives: the build reported its usual page count, that case stayed green, and only the new spec went red.

  So the probe has to be a class **this package's own sources never name**, and each case derives its own rather than hard-coding one: `tracking-[…]` read out of [`Button.tsx`](../web/src/ui/modules/core/primitives/Button.tsx) for the `core` directive, `[contain:…]` read out of [`shared.ts`](../web/src/ui/modules/pages/homepage/sections/shared.ts) for the homepage one. Each case asserts the probe is still on the rendered element before asserting the property resolved, so a `Button` that drops the class fails as *pick a new probe* rather than as a broken seam. The `@import` half needs no case of its own: `docs.spec.ts`'s theme toggle already reads `--frame` off `:root` and fails if the app's token sheets stop arriving.

  One consequence worth recording, because it is evidence about what the existing suite covers: with both directives broken, `demos.spec.ts` did go red, on exactly one page (`/design-system/animation/text/`) out of the whole site. A missing utility is not usually a thrown error, so that suite catches this class of failure by accident and only where a component happens to depend on a generated class at runtime.
- **The logo is the app's, copied rather than referenced.** [`src/assets/forever-pto-logo.png`](./src/assets/forever-pto-logo.png) and its dark twin are byte copies of `apps/web/public/static/images/`, because Starlight's `logo` option resolves inside this package and a path out of it is not an asset the build can process. [`src/components/SiteTitle.astro`](./src/components/SiteTitle.astro) draws it the way the app's header does, in a tilted accent box that straightens on hover, beside the version chip. A new logo in the app is three files to copy here: the two PNGs and `public/favicon.ico`, which is the app's `src/app/favicon.ico` byte for byte.
- **The font families are spelled in more than one place and not all of them are tied.** [`apps/web/src/app/fonts.ts`](../web/src/app/fonts.ts) is the source of truth: `next/font/google` registers `--font-bricolage`, `--font-space-grotesk`, `--font-instrument-serif` and `--font-jetbrains-mono`, and the app's `theme/index.css`, imported above, points `--font-sans` and its siblings at those names. There is no Next here to inject them, so [`src/styles/global.css`](./src/styles/global.css) declares the same names in `:root` over the self-hosted `@fontsource` faces. Swap a family in the app and the role token points at a variable this site never defines, so the wiki renders in the browser default while the specimen beside it still names the old family. The contract suite asserts every registered variable is declared here. The remaining spelling is `TypeSpecimen`'s human-readable `label`, which stays prose; nothing mechanises that half.
- **The `@ui` alias is declared once, in [`tsconfig.json`](./tsconfig.json), and `astro.config.ts` derives the vite alias from it.** Both files resolve against this directory, so the string needs no adjustment; it was spelled in both, plus twice more inside the contract suite, with nothing comparing them. Move the app's UI layer and there is one line to change.
- **What this package reaches into the app for is what `docs.yml` has to trigger on.** Today that is all of `src/ui/`, plus [`src/domain/calendar/types.ts`](../web/src/domain/calendar/types.ts), [`src/domain/calendar/const.ts`](../web/src/domain/calendar/const.ts) and [`src/infrastructure/i18n/locales.ts`](../web/src/infrastructure/i18n/locales.ts), which `HowItWorksDemo` and `PlanningEngineDemo` import by relative path. Reaching for a new app module means adding its path to both trigger blocks, or a rename over there merges green and breaks the site here.
- Only Next-free modules may be imported into demos. Anything touching `next/*`, `next-themes`, `@application`, `@domain` or `@infrastructure` is reference-only: document it, do not import it.
- **A component that needs an app context gets the context, not a note saying it cannot be rendered, and `Demo` supplies it, so no demo has to remember.** `LazyMotionProvider` is needed by every `m.*` consumer and `DemoIntlProvider` by the `next-intl` ones in `core/`: `SlidingNumber`, which reads the locale to pick its decimal separator, and `Counter`, which wraps it. Both would otherwise throw during prerender, since `client:visible` still renders on the server.

  Many of the demos used to wrap `LazyMotionProvider` themselves and some also wrapped the intl one, with this bullet as the only thing telling the next author to do the same; and forgetting does not fail typecheck, it fails the build, in the other workflow. `Demo` composes both around the frame now. The cost is nil: `LazyMotion` with `domAnimation` is lazy by construction and `NextIntlClientProvider` with empty messages is inert for anything that does not consume it. Add a provider **here** rather than at a demo.
- Never import [`src/ui/styles/index.css`](../web/src/ui/styles/index.css) (double preflight + layer collision with Starlight). The allowed style imports live in `src/styles/global.css` and are ordered deliberately; read its header comment before touching it.

## Conventions

- **Anti-drift rule**: prose names a file, never a volatile literal. Where the app exports a constant (cookie names, enums, CVA objects), import it into the MDX/demo and interpolate; component variant tables are typed `Record`s over `VariantProps<typeof xxxVariants>` so renames break `astro check`. Token values render through the runtime visualizers (`TokenSwatch`, `ShadowScale`, `TypeSpecimen`). Prop tables go through [`src/components/PropsTable.tsx`](./src/components/PropsTable.tsx): each demo exports `X_PROP_ROWS` built with `propRows<OwnProps<ComponentProps<typeof X>, Base>>`, where `OwnProps` is the component's keys minus the element or primitive it wraps, so the `Record` is exhaustive over exactly the props the app adds and a prop the app adds, renames or removes fails `astro check` until its row is written. Where the delta is not a clean set (a component whose props are an intersection with Motion's, or a Base UI root passed through untouched) the rows are untyped and list the props worth knowing; the page says which base the rest are forwarded to.
- **Diagrams are Mermaid fences, rendered in the browser.** Starlight runs on Sätteri, Astro's default Markdown processor, which takes mdast plugins rather than remark ones: [`src/lib/mermaid-plugin.ts`](./src/lib/mermaid-plugin.ts) turns every ```mermaid fence into a `<pre class="mermaid" data-mermaid="…">` before Expressive Code can highlight it, and `astro.config.ts` hands it to `satteri({ mdastPlugins })` as `markdown.processor`, which the MDX integration inherits. [`src/lib/mermaid.ts`](./src/lib/mermaid.ts), booted from `Head.astro`, lazy-loads `mermaid` only on a page that carries a fence, draws every diagram with the app's own tokens read off `:root` at render time, and redraws when Starlight rewrites `data-theme`. The source travels URI-encoded in the attribute and as the element's text, so a reader without JavaScript sees the definition. `rehype-mermaid` was the alternative and was not taken: it renders at build time through Playwright, which the build job would then need for every page rather than for the suite, and its SVGs carry one palette. The CSP in `public/_headers` already admits inline styles, which Mermaid's SVGs need.
- Demos live in [`src/components/demos/`](./src/components/demos), wrapped in `<Demo>` and hydrated with `client:visible`. Motion-based components need `<LazyMotionProvider>`. `Demo` renders a *Live · apps/web* chip **outside** the `data-demo` frame, deliberately: the demos suite counts that frame's children, and a chip inside it would let a demo that renders nothing pass as rendered.
- **Every component page carries the same sections**, in this order: the live demos, `## Props` (the table above, one per exported part that adds props), `## Usage`, `## Conventions`, `## Accessibility` (role, keyboard, labelling: what Base UI wires and what the caller owes) and `## In the app` (the feature modules that import it, cited as file names the contract suite resolves). A page missing one is incomplete, not minimal. Pages that render a live demo carry `sidebar.badge: Live`.
- **`Demo` marks its frame with `data-demo`, and [`e2e/demos.spec.ts`](./e2e/demos.spec.ts) walks every page that carries one.** The
  list is derived from `dist/**/index.html` after the build, not from the MDX sources, because the source
  question ("does this file import from `components/demos/`?") answers yes for a page that merely names the
  folder in prose and for one that imports a plain constant like `APP_LOCALES`. The built HTML is what is
  actually served. One test per page plus a floor assertion, so a build that stops emitting demos fails
  rather than passing with an empty list; the floor is the number to read, and it is in the spec rather
  than here, where nothing could keep it true.

  Each page is asserted several ways: it answers 200, every `data-demo` frame has at least one element child
  once scrolled into view, and the page raises no `pageerror` and logs no `console.error`. That third one is
  the point: **a demo can break in the browser and build green.** A `useEffect` that throws was used to
  verify it: `astro build` reported its pages built, and the suite went red. Asserting on *text* instead does
  not work, and was the first attempt: an `Input` or `Slider` demo legitimately renders no text at all.

  **The smoke job does not build either, and that is a different problem with the same root.** Playwright
collects every spec before it applies `--grep`, so `demos.spec.ts` reading `dist/` at module scope killed
`Docs production smoke tests` with `ENOENT ... scandir dist` on a job whose whole purpose is to request a
deployed site. The config's `dist` guard could not help: it deliberately skips when `BASE_URL` is set, which
is exactly that job. The spec now derives an empty page list and skips its floor assertion when `BASE_URL`
is set, so it stays a local-build suite and stops breaking a run it was never part of. No sibling repository
has this shape — nothing in their `e2e/` reads the filesystem while collecting.

**`test:e2e` does not build, and it needs the build.** `astro preview` serves `dist`, it does not produce it, and
  the page list is read off `dist` while the spec file is being collected, so a clean checkout died with
  `ENOENT ... scandir dist` before a single test was reported, and the preview server's own failure named nothing.
  [`playwright.config.ts`](./playwright.config.ts) checks for `dist` when it loads, which is before the web server
  starts and before any spec is collected, and throws a message naming the build command. CI already builds first,
  so making the script build would have built the site twice per run.

  **Under a coding agent, `astro preview` puts itself in the background**, because Astro routes the command
  through `am-i-vibing` and switches to a daemon plus JSON logs when it detects one. The foreground process then
  exits at once and Playwright reports `Process from config.webServer exited early`. Run it a second time, which
  reuses the daemon, or `pnpm exec astro preview stop` first. A stale daemon started before a rebuild serves the
  previous HTML against the new assets, which shows up as a hydration error on one page and nothing else. CI is
  unaffected: no agent is detected there, so the server stays in the foreground.
- Content lives in [`src/content/docs/`](./src/content/docs) (root locale = English, pathless URLs). `es/` mirrors filenames; untranslated pages fall back to English automatically. Sidebar order via `sidebar.order` frontmatter.
- Formatting/linting: root Biome config (docs is not excluded; only [`apps/docs/src/styles`](./src/styles) is, for Tailwind directives). No Prettier. **This package carries no Biome scripts of its own.** It used to carry a character-for-character copy of the root manifest's, and nothing ran them: `lint-staged` calls the root script and `docs.yml` runs `typecheck`, `build` and `test:e2e`. Some were actively wrong, because `--changed` means "changed against `main`" and needs the git root to compare against. What is left is `dev`, `build`, `preview`, `deploy`, `upload`, `typecheck` and `test:e2e`.
- **[`src/content/i18n/es.json`](./src/content/i18n/es.json) holds only strings this site really changes.** Starlight ships its own Spanish bundle, and an override restating it byte for byte is worse than none: it pins a value upstream may correct and it buries the ones that are deliberate. The keys left are all shortenings that fit the chrome: `themeSelect.auto`, `page.editLink`, `page.previousLink` and `page.nextLink`. `search.ctrlKey` is why the rule exists. It read `Ctrl K`, and Starlight's search button renders `<kbd>{ctrlKey}</kbd><kbd>K</kbd>`, so every Spanish page shipped a search box reading `Ctrl K K`. The contract suite compares every key against the vendor bundle in `node_modules` and fails on an identical one. That comparison is byte for byte, so it could never have caught the key it is named for: `Ctrl K` is not `Ctrl`. A second rule covers the shape instead, asserting `search.ctrlKey` is a modifier on its own (no whitespace, and it does not end in the K Starlight appends), and reading `Search.astro`'s own markup first so it fails loudly if upstream stops rendering that second `<kbd>`. It covers this one key and no other: a rendered shape is checkable where a reworded string is prose.
- **Every sidebar group carries its `translations: { es }`, the nested ones included.** The ones under "Design system" did not, so a Spanish visitor read English labels inside an otherwise Spanish sidebar. "Design system" itself stays untranslated on purpose.
- **Commits touching docs use the `docs:` type**: the repo squash-merges and the PR title becomes the commit on main, so a `feat:`/`fix:` title would cut an app release. See `/contributing/conventions/`.

## Analytics and consent

The wiki measures itself, and everything it measures is browser-side. There is no observability here and there
cannot be: `wrangler.toml` declares no `main`, so Cloudflare serves the built assets without invoking a script
and there is no handler, `fetch` or binding call to trace. Naming a `destinations` entry would create a
destination that receives its own test message and nothing else.
[ADR 0019](../../adr/0019-the-wiki-measures-itself-with-its-own-consent-flow.md) records the whole decision.

- [`src/lib/analytics/consent.ts`](./src/lib/analytics/consent.ts) configures `vanilla-cookieconsent` with the
  library's own UI, in English and Spanish picked off `document.documentElement.lang`, and wires the answer to
  both services. [`src/components/Head.astro`](./src/components/Head.astro) is a Starlight `Head` override
  that emits Consent Mode defaults of `denied` before `gtag.js` loads, then boots the consent module.
- **This shares the library and the vocabulary with the app, and nothing else.** The `analytics` category and
  the `ga4` and `betterStack` service ids are the same strings, and `vanilla-cookieconsent` is pinned to the
  same version, so a reader can move between the two. The app's consent UI is React reading `next-intl` off
  its own bundles, with a cookie table listing Stripe cookies the wiki never sets; porting that into an island
  would cost more than the file it replaces.
- **Google Analytics uses the app's measurement id on purpose.** Both sites are subdomains of
  `forever-pto.com`, so one id gives a single session that runs from the wiki into the planner, separated by
  the `Hostname` dimension. It lives in one repository variable, `GOOGLE_ANALYTICS_ID`, and each workflow maps
  it to the prefix its bundler inlines.
- **Better Stack RUM uses a source of its own, per stage, under one variable name.** Sharing the app's would
  file wiki sessions under the app's `release`, and this tag passes no `release` of its own at all. So
  `BETTER_STACK_TRACKING_TOKEN` is a variable on `docs-development` and `docs-production`.
- **Which is why `build` in [`docs.yml`](../../.github/workflows/docs.yml) declares an `environment:`, and it
  had none.** A job without one reads an empty string from any environment variable, and the single
  `docs-dist` artifact both `preview` and `deploy` ship can only carry one baked value. The job now names
  `docs-development` on a pull request and `docs-production` on a push, so each build takes its own stage's
  token. If `docs-production` ever grows a required reviewer, that gate moves onto the build.
- **The tags report a floor, not a census.** Better Stack RUM is Sentry's browser SDK underneath and posts to
  a Sentry `envelope` endpoint, which ad blockers filter hard; GA4 fares no better. Only Cloudflare's own
  request analytics cannot be blocked. `blocked:other` on that POST in DevTools is an extension, not the CSP:
  `_headers` admits the host.
- **[`public/_headers`](./public/_headers) is new, and the site had no headers at all before it.** It carries
  the CSP that admits the two tags plus HSTS, `nosniff`, `DENY` framing and a referrer policy. The app states
  its own policy in `next.config.ts`, which the contract suite asserts; this one has no Worker to serve it
  from, so Cloudflare's static-asset `_headers` support is what applies it. Nothing compares the two.
- **[`e2e/cookie-consent.spec.ts`](./e2e/cookie-consent.spec.ts) has to tell the browser it is not a robot.**
  `vanilla-cookieconsent` defaults `hideFromBots` to true, and the check is
  `/bot|crawl|spider|slurp|teoma/i.test(userAgent) || navigator.webdriver`. Playwright sets
  `navigator.webdriver`, so the banner never renders while `run()` resolves without an error, which reads as
  broken code and is the library doing its job. The spec overrides that property in a `beforeEach`. Do not
  answer it by setting `hideFromBots: false`.

## Deploy

Wrangler environments, the same shape the app uses. `[assets]` is declared once at the top level and both inherit it. **`name` does not differ between the top level and production**: both are `forever-pto-docs`, and what production actually overrides is the route plus the exposure flags.

- **main**: `deploy --env production` → `forever-pto-docs`, bound to docs.forever-pto.com. The route is `custom_domain = true`, so wrangler provisions the DNS record and the certificate in the forever-pto.com zone itself; there is nothing to configure in the dashboard.
- **PRs**: `deploy --env development --name pr-<n>-forever-pto-docs-development` → one Worker per pull request at `pr-<n>-forever-pto-docs-development.fbuireu.workers.dev`. The `--name` override is what mints a fresh Worker instead of updating the stable one, so open PRs never overwrite each other's preview.
- **[`cleanup-development.yml`](../../.github/workflows/cleanup-development.yml) deletes it when the PR closes**, in a job of its own beside the app's. A per-PR Worker that nothing tears down accumulates forever.
- **Previews never touch the production Worker**, which is the whole point of the development environment: it carries no custom domain, so a preview cannot answer on docs.forever-pto.com.
- The GitHub environments are split per package: this site uses `docs-production` and `docs-development`, and carries none of the app's `NEXT_PUBLIC_*` values in either. What it does carry on both is `BETTER_STACK_TRACKING_TOKEN`, read by `build` rather than by a deploy job; see *Analytics and consent*. It does need the Cloudflare credentials: every docs job declares `environment:` and read `CLOUDFLARE_API_TOKEN` from inside it, so the pair is on the repository guide's setup checklist like the `web-*` pair. Only `PAT` and `CODECOV_TOKEN` are repository-level.
- **`workers_dev` and `preview_urls` are inheritable, so production has to refuse them explicitly.** Both are `true` at the top level, which is what a per-PR preview needs and what `[env.development]` therefore inherits rather than restating, and `[env.production]` sets both to `false`. They were inherited, so the published wiki also answered on a `workers.dev` origin, from a `robots.txt` that says `Allow: /`. Starlight emits a correct canonical, so that was hygiene rather than an incident.
- **`pnpm --filter forever-pto-docs deploy` passes no `--env`, so it deploys the top-level config to the live production Worker.** The top level carries production's own `name` with no route block and with `workers_dev = true`, so a local one-shot deploy overwrites docs.forever-pto.com and turns its `workers.dev` origin back on. Run `wrangler deploy --env production`, which is what the workflow runs.
