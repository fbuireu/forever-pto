# 10. The app and the docs site are sibling packages under apps/

Date: 2026-08-15

## Status

Accepted.

## Context

The repository held two things and treated only one of them as a package. `pnpm-workspace.yaml` listed `./` and `docs`, so the workspace root **was** the app: its dependencies, its scripts, its `tsconfig.json`, its `wrangler.toml` and its `src/` all sat at the top level, and the documentation site was the only thing with a directory of its own.

That asymmetry was not free, and every cost it imposed was already visible in the tree:

- `tsconfig.json` needed `"exclude": ["docs/**/*"]`, and `vitest.config.ts` needed `exclude: ['docs/e2e/**']`, purely because the root `include` of `**/*.ts` swallowed a sibling package.
- `.gitignore` carried five separate `docs/`-anchored patterns, and every one of them silently stopped matching the moment anything moved.
- `docs/astro.config.ts` reached *upward* into the root with `@ui` → `../src/ui`. The set of app paths it depends on was enumerated by hand in `docs.yml`'s trigger filter — `src/ui/modules/core/**`, `src/ui/modules/pages/homepage/sections/**`, `src/ui/styles/**`, `src/ui/utils/**` — which is the public surface of a shared library that no package declared.
- `docs/` meant three unrelated things at once: the Astro package, the ADR directory (decisions about the repository, not content of the site), and the consistency suite that asserts contracts across the whole tree.
- Most consequentially, one `package.json` at the root meant one version and one release line for both deliverables. A documentation dependency bump cut an app release. The workaround was a rule requiring docs pull requests to use the `docs:` commit type, plus a matching `semanticCommitType` override in `renovate.json` — two pieces of configuration whose only job was to stop the versioning model from doing the wrong thing.

The obvious alternative was the flat layout: `web/` and `docs/` as siblings of the repository root, which is what the sibling `contribKit` repository does. It was rejected. The dominant cost of restructuring is not moving files — that is one `git mv` — it is the churn in the contracts that name paths: twenty-two `CLAUDE.md` headings, the consistency suite, CI filters, the wrangler working directory, semantic-release asset globs, `README.md`, `CONTRIBUTING.md` and the ADRs themselves. That churn is paid in full on **every** restructure, not in proportion to the files moved. Under the flat layout, introducing a shared package later means moving `web/` and `docs/` again and paying it a second time; under `apps/`, it means adding a directory and paying nothing. The marginal cost of `apps/` today is near zero, because the aliases are declared relative to each package's own `tsconfig.json` and the cross-package `@ui` target is `../web/src/ui` under either shape.

Doing nothing was also considered and rejected: it preserves the release defect above, and the two workarounds papering over it.

## Decision

The repository is a pnpm workspace of sibling packages under `apps/`:

```
apps/web     the planner   (forever-pto)
apps/docs    the wiki      (forever-pto-docs)
adr/         repository decisions
tests/       repo-wide contract assertions
```

The workspace glob is `apps/*`. **There is no `packages/` directory**, and one is not created until a real shared package exists — an empty tier is speculative structure, and the extraction that would fill it is blocked on separate work: the components `apps/docs` consumes reach `next-intl` and `next-themes`, which the docs site currently supplies by wrapping demos in `LazyMotionProvider` and `DemoIntlProvider`. Turning that into a package is a design task, deliberately not bundled with a file move.

The repository root is the workspace root and nothing else: `forever-pto-monorepo`, private, `0.0.0`, no dependencies. It owns only the tooling that spans both packages — Biome, commitlint, husky, lint-staged, semantic-release, and the Vitest that runs `tests/`.

`adr/` is lifted to the repository root rather than living inside the docs package, because these decisions are about the repository, not content the site publishes. `docs-consistency.test.ts` moves to `tests/` for the same reason.

Two things are deliberately **not** split per package. `biome.json` stays shared: `--changed` needs the git root to compare against, and one pass is what lints both packages. And there is one lockfile; `.gitignore` carries `apps/*/pnpm-lock.yaml` so a stray per-package one cannot shadow the workspace resolution.

## Consequences

- **`apps/web/package.json`'s `version` is load-bearing at runtime, not only at release time.** Seven source files import the manifest and render `version` in the footer, the hero, the error page, the `/api/markdown` output and the `.well-known` agent-skills index, and `apps/docs` reads the same field to label its header. Because `src/` and the manifest moved together, every one of those relative imports still resolves — but the field is now read by two packages.
- **`apps/docs` must declare what it reaches.** Its transitive `@ui` closure bare-imports `react-use-measure` and `temporal-polyfill`, which it previously got for free from a root manifest that declared everything. Both are now declared. Importer-relative resolution would likely find them under `apps/web/node_modules` regardless, so this makes a real coupling visible rather than repairing a proven break.
- **The install must never be filtered.** `apps/docs` compiles app sources through the `@ui` alias, so a `--filter forever-pto-docs` install leaves the dependencies those sources import absent. `prepare-env` installs the whole workspace.
- **`biome.json`'s exclusions are repository-relative paths and nothing asserts they resolve.** Both of them — `next-env.d.ts` and the docs styles directory — were silently dead between the move and the fix, because Biome anchors `files.includes` globs at the config directory. A future move has to re-prefix them by hand, and the failure mode is a formatter quietly rewriting generated output.
- **Every nested guide's relative links gained two segments**, and the deepest is now five to seven `../` from `adr/`. They are mechanical and they were repaired mechanically, but they are also invisible to a reader until the consistency suite runs.
- **`apps/` with no `packages/` borrows a convention from task-runner monorepos this repository does not use.** A reader arriving from Turborepo or Nx will look for the missing tier. That is the price of making the later extraction additive.
- Recorded elsewhere: the layout table and shared-tooling rules in [`../CLAUDE.md`](../CLAUDE.md), the package guides at [`../apps/web/CLAUDE.md`](../apps/web/CLAUDE.md) and [`../apps/docs/CLAUDE.md`](../apps/docs/CLAUDE.md), and the workspace-shape assertions in [`../tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts). Per-package versioning, which this layout is what makes possible, is [ADR 0011](./0011-per-package-versioning-with-a-bridge-tag.md).
