# Contributing to Forever PTO

Thanks for considering it. Forever PTO is a Next.js App Router app deployed to
Cloudflare Workers, and the one fact that shapes everything else is that **the
whole planner runs in the browser**: the server holds payment and contact
records and nothing else. Read this before your first pull request; it will
save you a rejected commit.

If you want the shape of the codebase, that is [CLAUDE.md](./CLAUDE.md) and
the nested guides it links. If you want the vocabulary, that is
[CONTEXT.md](./CONTEXT.md). If you want the *why*, that is
[docs/adr/](./adr/).

## Code of Conduct

By participating you are expected to uphold the
[Code of Conduct](./CODE_OF_CONDUCT.md). In short:

- **Be respectful**: different viewpoints and experiences are valuable
- **Be constructive**: focus on what is best for the project
- **Be collaborative**: work together towards common goals
- **Be patient**: we all have different levels of experience

## How can I contribute?

### Reporting bugs

Check the existing issues first, then use the
[bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include what you
did, what you expected, and what actually happened. For planner bugs, add the
Country, Region, year and PTO budget you were looking at, since the whole
calculation depends on them.

Security issues go through the [Security Policy](./SECURITY.md), not a public
issue.

### Suggesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
Describe the problem before the solution, and check
[Discussions](https://github.com/fbuireu/forever-pto/discussions) first; some
ideas are already being talked about.

### Improving documentation

Use the [documentation template](.github/ISSUE_TEMPLATE/documentation.yml), or
just open a PR. Note that the agent-facing guides (`CLAUDE.md` and friends)
are held to the code by a test; see *The docs are part of the change* below.

## Getting started

```bash
# Requires the Node version in .nvmrc and pnpm (see packageManager in package.json)
# Always pnpm, never npm or yarn
pnpm install

# Copy the env file and fill in values; local Worker secrets go in .dev.vars
cp .env.example .env

# Set up git hooks
pnpm prepare

# Start the dev server
pnpm dev
```

`pnpm preview` runs the app in the real Workers runtime through OpenNext when
a change touches anything server-side.

## Checks

Everything CI runs, you can run locally:

```bash
pnpm lint:all           # biome lint (append :fix to autofix)
pnpm format:all         # biome check --write
pnpm typecheck          # root program, then apps/web, then apps/docs
pnpm test:ut            # unit tests (vitest)
pnpm test:e2e           # end-to-end tests (playwright)
```

Husky runs lint-staged on pre-commit, commitlint on commit-msg and
`pnpm verify` on pre-push, the same command CI runs.

## Conventions that will bite you if you skip them

- **Use the glossary's words.** [CONTEXT.md](./CONTEXT.md) names one canonical
  term per concept: PTO Day, Bridge, Suggestion, Donation. A variable named
  after a retired term is a defect, not a style preference.
- **No explanatory comments in TypeScript sources under `src/`.** The folder's
  `CLAUDE.md` carries the explanation instead.
- **One argument is positional and two or more are a single object typed
  `<FunctionName>Params`**: `localePath({ locale, path }: LocalePathParams)`.
  The exception is a function a runtime calls back, such as a `toSorted`
  comparator, which is handed its arguments one at a time.
- **`Temporal` comes from `temporal-polyfill`, never the global**: the global
  does not resolve in the deployed Workers runtime.
- **Cross-layer imports use the path aliases; same-folder imports stay
  relative.**
- **Conventional commits are mandatory**: semantic-release derives versions
  and the changelog from them, and commitlint rejects anything else.
- **Don't bump Next or TypeScript.** They are pinned as a pair by the
  Cloudflare adapter; the *Structure & aliases* section of
  [CLAUDE.md](./CLAUDE.md) explains why raising either breaks the build or
  the deployed Worker.

## The docs are part of the change

This repo treats its documentation as part of the code: change one, update the
other **in the same commit**. [`tests/docs-consistency.test.ts`](./tests/docs-consistency.test.ts) runs with the
unit tests and fails the build when the mechanical half of that contract is
broken: scripts that no longer exist, links that no longer resolve, aliases
that moved. [CLAUDE.md](./CLAUDE.md) has the full table of what to update for
a given change.

## Pull requests

1. Fork, branch from `main`, make the change.
2. Run the checks above; fill in the PR template.
3. Every PR gets its own preview Worker deployed by CI, so reviewers can try
   the change live.
4. After merge to `main`, semantic-release versions and deploys automatically;
   there is no manual release step.

Thanks for contributing! 🎉
