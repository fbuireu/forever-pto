<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/logo-dark.svg">
  <img src="src/assets/logo-light.svg" alt="" width="72" align="center">
</picture>

# forever-pto-docs

**The wiki.** Astro Starlight on Cloudflare Workers, rendering the app's real components.

**[docs.forever-pto.com](https://docs.forever-pto.com)** · **[Repository README](../../README.md)** · **[Agent guide](./CLAUDE.md)** · **[Glossary](../../CONTEXT.md)**

</div>

---

## What it is

The documentation site for Forever PTO: architecture, runtime flows, the CI/CD lifecycle, and a design
system section that hydrates the **real** components from [`apps/web`](../web) as React islands, styled by the
app's own tokens. Nothing here is a copy of a component — the demos import the originals through the
`@ui` alias, so a rename in the app breaks `astro check` here.

## Running it

```bash
pnpm install                          # from the repository root, never filtered
pnpm --filter forever-pto-docs dev    # dev server
pnpm --filter forever-pto-docs build  # 155 pages
pnpm --filter forever-pto-docs check  # astro check
```

**The install must not be filtered.** The demos compile app sources, and their bare imports resolve from
the package the importing file sits in — a filtered install leaves `apps/web/node_modules` absent and the
build fails on a dependency this package never declared.

## Layout

```
src/
  content/docs/    the pages themselves (.mdx); es/ mirrors filenames
  components/      Demo wrappers, the token visualizers, demos/
  lib/             app-version, read from apps/web/package.json at build time
  styles/          global.css — read its header before touching the import order
  assets/          the wiki's own logo pair
e2e/               a small Playwright smoke suite
astro.config.ts    Starlight config, the @ui alias, the sidebar
wrangler.toml      two environments: production and development
```

Read [`CLAUDE.md`](./CLAUDE.md) before changing anything: it carries the boundary rules — which app
modules may be imported into a demo, why a component that needs an app context gets the context rather
than a note saying it cannot be rendered, and why [`src/ui/styles/index.css`](../web/src/ui/styles/index.css) must never be imported here.

## Deploying

- **main** → `deploy --env production` → docs.forever-pto.com
- **a pull request** → its own Worker, `pr-<n>-forever-pto-docs-development`, deleted when the PR closes

Previews never touch the production Worker. The site displays the **app's** version, not its own —
this package stays at `0.0.0` permanently and nothing reads it.

## Writing

- Pages live in [`src/content/docs/`](./src/content/docs). The root locale is English with pathless URLs; `es/` mirrors
  filenames and anything untranslated falls back to English automatically.
- **Prose names a file, never a volatile literal.** Where the app exports a constant, import it and
  interpolate, so a rename breaks the build instead of rotting the page.
- [`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) checks that every source file these pages cite in backticks still
  exists. It found seven that did not.
