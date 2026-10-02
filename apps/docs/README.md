<div align="center">

<img src="src/assets/forever-pto-logo.png" alt="" width="72" align="center">

# forever-pto-docs

**The wiki.** Astro Starlight on Cloudflare Workers, rendering the app's real components.

**[docs.forever-pto.com](https://docs.forever-pto.com)** · **[Repository README](../../README.md)** · **[Agent guide](./AGENTS.md)** · **[Glossary](../../CONTEXT.md)**

</div>

---

## What it is

The documentation site for Forever PTO: architecture, runtime flows, the CI/CD lifecycle, and a design
system section that hydrates the **real** components from [`apps/web`](../web) as React islands, styled by the
app's own tokens. Nothing here is a copy of a component: the demos import the originals through the
`@ui` alias, so a renamed export or prop breaks `astro check` here, and a moved module fails the contract suite,
which resolves every `@ui` specifier the site imports.

## Running it

```bash
pnpm install                              # from the repository root, never filtered
pnpm --filter forever-pto-docs dev        # dev server
pnpm --filter forever-pto-docs build      # the whole site
pnpm --filter forever-pto-docs typecheck  # astro check
```

**The install must not be filtered.** The demos compile app sources, and their bare imports resolve from
the package the importing file sits in; a filtered install leaves `apps/web/node_modules` absent and the
build fails on a dependency this package never declared.

## Layout

```
src/
  content/docs/    the pages themselves (.mdx); a locale's folder holds its translated pages
  components/      Demo wrappers, the token visualizers, PropsTable, demos/
  lib/             app-version (read from apps/web/package.json at build time), the Mermaid
                   pipeline (mermaid-plugin.ts + mermaid-render.ts at build, mermaid.ts for zoom), analytics
  styles/          global.css, read its header before touching the import order
  assets/          the app's logo, copied from apps/web/public/static/images
e2e/               Playwright against the built site: the smoke set, the demos, the Tailwind sources, consent
astro.config.ts    Starlight config, the @ui alias, the sidebar
wrangler.toml      environments: production and development
```

Read [`AGENTS.md`](./AGENTS.md) before changing anything: it maps the site and the seams it shares with the app.
The rules a review holds the site to are the *Docs site* section of
[`CODING_STANDARDS.md`](../../CODING_STANDARDS.md).

## Deploying

- **main** → `deploy --env production` → docs.forever-pto.com
- **a pull request** → its own Worker, `pr-<n>-forever-pto-docs-development`, deleted when the PR closes

Previews never touch the production Worker. The site displays the **app's** version, not its own:
this package's version is cut as `docs-vX.Y.Z` with its own `CHANGELOG.md`, and nothing reads it.

## Writing

- Pages live in [`src/content/docs/`](./src/content/docs). The root locale is English with pathless URLs; a translated
  page sits under its locale's folder with the English filename (`es/` holds the ones translated so far), and anything
  untranslated falls back to English automatically.
- Diagrams are ```mermaid fences, drawn at build time in the app's palette, once per theme; a fence Mermaid cannot
  parse fails the build.
- How a page is written (prose that names a file, the component page sections, typed tables) is the *Docs site*
  section of [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md).
- [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) checks that every source file these pages cite in backticks still
  exists.
