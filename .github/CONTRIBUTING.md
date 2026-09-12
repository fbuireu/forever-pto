# Contributing to Forever PTO

Thanks for considering it. Forever PTO is a Next.js App Router app deployed to Cloudflare Workers, and the
one fact that shapes everything else is that **the whole planner runs in the browser**: the server holds
payment and contact records and nothing else. Read this before your first pull request; it will save you a
rejected commit.

If you want the shape of the codebase, that is [CLAUDE.md](../CLAUDE.md) and the package guides it links.
If you want the vocabulary, that is [CONTEXT.md](../CONTEXT.md). If you want the *why*, that is
[adr/](../adr/).

## Code of Conduct

By participating you are expected to uphold the [Code of Conduct](./CODE_OF_CONDUCT.md). In short:

- **Be respectful**: different viewpoints and experiences are valuable
- **Be constructive**: focus on what is best for the project
- **Be collaborative**: work together towards common goals
- **Be patient**: we all have different levels of experience

## How can I contribute?

### Reporting bugs

Check the existing issues first, then use the [bug report template](ISSUE_TEMPLATE/bug_report.yml). Include
what you did, what you expected, and what actually happened. For planner bugs, add the Country, Region, year
and PTO budget you were looking at, since the whole calculation depends on them.

**A mistake in the text is a content issue, not a bug.** The planner's copy lives in the locale bundles
under `apps/web/src/ui/i18n/messages` and the docs site's pages under `apps/docs/src/content/docs`, so a
pull request can fix either; if you would rather not open one, use the
[content issue template](ISSUE_TEMPLATE/content_issue.yml) and say which language it is in.

Security issues go through the [Security Policy](./SECURITY.md), never a public issue.

### Suggesting features

Use the [feature request template](ISSUE_TEMPLATE/feature_request.yml). Describe the problem before the
solution, and check [Discussions](https://github.com/fbuireu/forever-pto/discussions) first; some ideas are
already being talked about.

### Improving documentation

Use the [documentation template](ISSUE_TEMPLATE/documentation.yml), or just open a pull request. The
user-facing documentation is the docs site, built from `apps/docs`; the agent-facing guides (`CLAUDE.md` and
friends) are held to the code by a test, so read *The docs are part of the change* below before editing one.

## Getting started

Both runtimes are pinned exactly and must match: Node in [`.nvmrc`](../.nvmrc), mirrored in `engines.node`,
and pnpm in `packageManager`. Read the pin from the file; it is not written down anywhere else on purpose.

```bash
git clone https://github.com/YOUR_USERNAME/forever-pto.git
cd forever-pto

# Always pnpm, never npm or yarn. This also installs the git hooks
pnpm install

# Copy the env file and fill in values; local Worker secrets go in apps/web/.dev.vars
cp apps/web/.env.example apps/web/.env.development

# Start the dev server
pnpm dev
```

`pnpm preview` runs the app in the real Workers runtime through OpenNext when a change touches anything
server-side. `pnpm --filter forever-pto-docs dev` runs the docs site.

## Checks

Everything CI runs, you can run locally, from the repository root:

```bash
pnpm lint:all           # biome lint over both packages (append :fix to autofix)
pnpm format:all         # biome check --write over both packages
pnpm typecheck          # the root program, then apps/web, then apps/docs (astro check)
pnpm test:ut            # apps/web unit tests, then the contract suite
pnpm test:docs          # the contract suite alone
pnpm test:e2e           # apps/web playwright
pnpm verify             # format check, typecheck and coverage: what CI runs
```

Husky runs lint-staged on `pre-commit`, commitlint on `commit-msg` and `pnpm verify:changed` on `pre-push`.
The hook runs the changed-only variant rather than `verify` because the coverage floor and a subset run
cannot both hold; CI runs the full `pnpm verify` on the pushed sha, so a push whose coverage dropped still
fails its check. [CLAUDE.md](../CLAUDE.md) explains the trade.

## Conventions that will bite you if you skip them

- **Use the glossary's words.** [CONTEXT.md](../CONTEXT.md) names one canonical term per concept: PTO Day,
  Bridge, Suggestion, Donation. A variable named after a retired term is a defect, not a style preference.
- **No explanatory comments in TypeScript sources.** The folder's `CLAUDE.md` carries the explanation
  instead.
- **One argument is positional and two or more are a single object typed `<FunctionName>Params`**:
  `localePath({ locale, path }: LocalePathParams)`. The exception is a function a runtime calls back, such
  as a `toSorted` comparator, which is handed its arguments one at a time.
- **`Temporal` comes from `temporal-polyfill`, never the global**: the global does not resolve in the
  deployed Workers runtime.
- **Cross-layer imports use the path aliases; same-folder imports stay relative.** No re-export barrel
  files: import from the source module.
- **Don't bump Next or TypeScript on your own.** Next and the Cloudflare adapter move as a pair, and the
  docs package is held to an older TypeScript line than the app; the *Versions* section of
  [CLAUDE.md](../CLAUDE.md) explains why raising either breaks the build or the deployed Worker.

## Commit rules

Conventional Commits, enforced by commitlint on `commit-msg`. semantic-release owns versioning, so the type
you choose is the version bump you get.

| Type | Bump | Example |
| --- | --- | --- |
| `feat` | minor | `feat(web): suggest a second bridge when the first is full` |
| `fix` | patch | `fix(web): keep the PTO budget after a locale switch` |
| `perf` | patch | `perf(web): memoise the effective-day count` |
| `revert` | patch | `revert: feat(web): suggest a second bridge` |
| `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build` | none | `docs: correct the bridge definition` |

Breaking changes take a `!` after the type or a `BREAKING CHANGE:` footer, and bump the major.

A scope is optional and unconstrained; naming the package (`web` or `docs`) is the usual choice.

**`main` takes squash merges, so the pull request title is the commit that lands.** The `commit-msg` hook
lints what you type locally, and [`commit-message.yml`](./workflows/commit-message.yml) lints the pull
request title on every open and edit, because that title is what semantic-release parses. Title the pull
request the way you would title a commit.

**One pull request, one package.** Each package versions itself, and a commit belongs to whichever package
its paths fall under ([ADR 0011](../adr/0011-per-package-versioning-with-a-bridge-tag.md)). A pull request
spanning `apps/web` and `apps/docs` therefore lands as one commit in both changelogs and can cut both
releases. Keep a pull request to one package where you can; the `cross-package-notice` job comments when one
spans both and does not block it, because a change that genuinely spans both is legitimate.

Do **not** add a `Co-Authored-By` trailer for an AI assistant to a commit or a pull request.

## The docs are part of the change

This repo treats its documentation as part of the code: change one, update the other **in the same
commit**. A follow-up commit is a promise, not a fix.
[`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) runs with the unit tests and fails the
build when the mechanical half of that contract is broken: scripts that no longer exist, links that no
longer resolve, aliases that moved. When it fails, the docs and the code disagree; fix whichever is wrong,
and never delete an assertion to get green. [CLAUDE.md](../CLAUDE.md) has the full table of what to update
for a given change.

## Pull requests

1. Fork, branch from `main`, make the change.
2. Run the checks above; fill in the pull request template, GIF included.
3. CI deploys a per-PR preview Worker for each package and comments its URL on the pull request, so
   reviewers can try the change live. The E2E suite runs against the preview and gates the merge.
4. After merge to `main`, semantic-release versions and deploys automatically; there is no manual release
   step. A web release is cut only after the production deploy and its smoke run pass.

## Use of AI

If you use AI tools when contributing:

- **Review everything it produces.** You are responsible for what you submit.
- **Check its claims against the code.** A doc claim nobody verified is a doc claim that is wrong.
- **Disclose significant use** in the pull request description.
- **Do not add a Claude or Copilot co-author trailer** to commits or pull requests.

## Questions

- **Issues**: <https://github.com/fbuireu/forever-pto/issues>
- **Discussions**: <https://github.com/fbuireu/forever-pto/discussions>
- **Documentation**: <https://docs.forever-pto.com>
- **Security**: [SECURITY.md](./SECURITY.md)

Thanks for contributing! 🎉
