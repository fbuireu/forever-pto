# AGENTS.md

Agent-facing guide for the **forever-pto** repository, a workspace holding the Forever PTO planner and its
documentation site. [CONTEXT.md](./CONTEXT.md) is the domain glossary (PTO Day, Bridge, Suggestion, Alternative,
Effective Day, Efficiency, Donation…); do not duplicate it here.

Reviewing a diff: [CODING_STANDARDS.md](./CODING_STANDARDS.md).

This file covers the repository: its layout, its shared tooling, how versions are cut and how CI is wired.
**The guide for the code you are about to touch is the package's own**, and it carries the detail this one omits.

## Packages

| Package | Guide | What it is |
| --- | --- | --- |
| [`apps/web`](./apps/web) (`forever-pto-web`) | [`./apps/web/AGENTS.md`](./apps/web/AGENTS.md) | The planner. Next App Router on Cloudflare Workers through OpenNext |
| [`apps/docs`](./apps/docs) (`forever-pto-docs`) | [`./apps/docs/AGENTS.md`](./apps/docs/AGENTS.md) | docs.forever-pto.com. Astro Starlight, rendering the app's real components |

## Layout

```
apps/
  web/                Next + React + OpenNext → Cloudflare Workers
  docs/               Astro Starlight → Cloudflare Workers (static assets)
adr/                  Architecture decision records, one decision per file
tests/                docs-consistency, the contract suite that holds the documents to the tree
patches/              patchedDependencies, applied by pnpm
.github/              Workflows and the prepare-env composite action
biome.json            Lint and format for both packages
CODING_STANDARDS.md   What a review holds a diff to
CONTEXT.md            The domain glossary, root only
```

There is no `packages/` tier. It is added to [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) the day a real shared
package exists, not before; see [ADR 0010](./adr/0010-apps-web-and-apps-docs-monorepo-layout.md).

## Versions

This section names where each version is pinned and never what the pin says: read the manifest.
`tests/docs-consistency.test.ts` asserts the shape a bump cannot change, and no document outside `adr/` names a
runtime or a framework beside a version.

- Node ([`.nvmrc`](./.nvmrc), mirrored in `engines.node`): `.nvmrc` is what every CI job installs, and the two
  spellings are asserted equal
- pnpm (`packageManager`, and in no workspace manifest): always use pnpm, never npm/yarn
- TypeScript at the root and in `apps/web` moves as one; `apps/docs` stays on the **6** line, because `astro check`
  refuses to run under 7: the native compiler ships no programmatic API for it to load. The split is asserted, and it
  closes the day Astro supports 7
- Next with `@opennextjs/cloudflare` ([`apps/web/package.json`](./apps/web/package.json)): they move as a pair
  ([ADR 0009](./adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md)); the reasoning belongs to the app:
  [`./apps/web/AGENTS.md`](./apps/web/AGENTS.md)

## Commands

Every command below runs from the repo root. The build and run scripts delegate to `apps/web`; the lint, format and
test scripts are root-owned because they span both packages.

```bash
pnpm dev                # apps/web dev server
pnpm build              # apps/web production build
pnpm preview            # apps/web on the real Workers runtime
pnpm deploy             # apps/web build + deploy to Cloudflare
pnpm cf:typegen         # regenerate apps/web/cloudflare-env.d.ts (reference only)

pnpm lint:all           # biome lint over both packages (:fix to autofix)
pnpm format:all         # biome check --write over both packages
pnpm format:check       # biome check, no writes; what verify runs
pnpm typecheck          # the root program, then apps/web, then apps/docs (astro check)

pnpm test:ut            # apps/web unit tests, then the contract suite
pnpm test:docs          # the contract suite alone
pnpm test:ut:coverage   # apps/web with coverage, then the contract suite without it
pnpm test:e2e           # apps/web playwright
pnpm verify:static      # format:check && typecheck: everything verify does but the suites
pnpm verify             # verify:static && test:ut:coverage; the CI Check job
pnpm verify:changed     # verify:static && test:ut:changed; what pre-push runs
```

`pnpm --filter forever-pto-docs dev` runs the docs site; it has no root passthrough.

Coverage has a floor on every metric, one `MIN_THRESHOLD` in [`apps/web/vitest.config.ts`](./apps/web/vitest.config.ts),
the same shape and number the sibling repositories use; the root [`vitest.config.ts`](./vitest.config.ts) collects the
contract suite alone and measures no coverage. The Check job's summary therefore shows two Vitest reports, each
headed by the `summaryLabel` the root config registers.

Husky runs `lint-staged` on `pre-commit`, `commitlint` on `commit-msg` and `verify:changed` on `pre-push`. The hook is
weaker than the CI `Verify` job on purpose: a changed-only run and the coverage floor cannot both hold, so coverage
stays in CI, which runs the full `pnpm verify` on the pushed sha. **`pre-push` also fires inside the release job**,
because `@semantic-release/git` pushes and husky is installed on the runner, so a broken `test:ut:changed` stops a
release too.

`typecheck` ends with `astro check`, which types every docs demo against the app's real props and so puts the
cross-package seam in front of the author. Run it that way, never as `tsc -p apps/docs`, which reports artefacts of
Astro's JSX namespace applied to React components as errors.

## Shared tooling

**One Biome config, at the root, for both packages**, and neither package carries one or any Biome script of its own:
`--changed` needs the git root to compare against. Its `files.includes` exclusions are repo-relative paths, so a move
has to re-prefix them, and so are the files the `noDefaultExport` override exempts (the Next file conventions, the
`next-intl` request config, the Playwright global setup): a new Next convention file or a moved exemption needs its
entry. `.astro` files keep the linter but lose `noUnusedImports` and `noUnusedVariables` through an `overrides` entry,
because Biome parses only their frontmatter; `astro check` covers them.

**One lockfile, at the root.** [`.gitignore`](./.gitignore) carries `apps/*/pnpm-lock.yaml` so a stray per-package
lockfile cannot shadow the workspace resolution.

**The root package is `forever-pto-monorepo`: private, at `0.0.0`, with no `dependencies`.** A dependency there would be
installed for both packages and belong to neither; its `devDependencies` are the repo-wide tools.

## Conventions

- **Conventional commits** (commitlint + husky). semantic-release owns versioning. Do NOT add a Co-Authored-By /
  Claude trailer to commits or PRs.
- **One package per pull request.** The repo squash-merges, and a release is attributed to a package by the paths the
  commit touches, so a PR spanning both packages lands in both changelogs.

## Releases

Each package versions itself, through `semantic-release-monorepo`, and a commit belongs to whichever package its
paths fall under: `web-vX.Y.Z` from [`ci.yml`](./.github/workflows/ci.yml) after the production deploy and its smoke
run, `docs-vX.Y.Z` from [`docs.yml`](./.github/workflows/docs.yml) after the docs deploy and its smoke run.
[ADR 0011](./adr/0011-per-package-versioning-with-a-bridge-tag.md) records the decision and its costs, and the
published [release page](./apps/docs/src/content/docs/infra/release.mdx) walks through the chain.

- Both release jobs share the `release` concurrency group and fast-forward onto `origin/main` before releasing, so a
  merge that lands mid-run joins that release.
- **Annotate every bridge tag with its own reason.** semantic-release reads the **highest** tag matching `tagFormat`,
  so an unannotated one reads as debris and invites a tidy-up that deletes the wrong tag.
- **On a history rewrite, push the tag before the branch, never after**, and never force-push `main` while a release
  is in flight. A tag on a commit `main` cannot reach stops every later release on
  `fatal: tag '<version>' already exists`, and the GitHub Release that carries it is `immutable`, so the tag cannot
  be moved: `git merge -s ours` of the orphaned release commit into `main` makes it reachable again without changing a
  file. A further rewrite orphans it again.
- A change confined to the repo root (`adr/`, `tests/`, `README.md`, `CONTEXT.md`, this file) releases nothing.
  `WEB_PATHS` in `ci.yml` also matches the root [`package.json`](./package.json), the lockfile,
  `pnpm-workspace.yaml`, [`patches/`](./patches), [`biome.json`](./biome.json), `.nvmrc`,
  [`.github/actions/`](./.github/actions) and the two web workflows, which redeploy the app and run `release-web`, and
  the release job then cuts nothing, because it attributes by the package path.

## CI

**[`ci.yml`](./.github/workflows/ci.yml) holds the whole app graph**: `changes` and `verify` in parallel, then
`deploy-production` → `release-web` → `docs-refresh` and `deploy-production` → `smoke` on `main`, or
`deploy-development` → `comment` / `e2e` on a PR, and a final `check` job that aggregates every one of them. Both
deploy jobs call the shared [`_deploy-web.yml`](./.github/workflows/_deploy-web.yml).
[`docs.yml`](./.github/workflows/docs.yml) holds the docs graph: its own `changes`, then `build`, then `preview` on a
PR or `deploy` → `smoke` → `release-docs` on `main`, with `rollback` when that smoke run fails, and its own
aggregate, `Check (docs)`. The rest are
[`cleanup-development.yml`](./.github/workflows/cleanup-development.yml), a
[`zizmor.yml`](./.github/workflows/zizmor.yml) audit,
[`dependency-review.yml`](./.github/workflows/dependency-review.yml),
[`commit-message.yml`](./.github/workflows/commit-message.yml), which lints the pull request **title** (the commit a
squash merge lands), and [`dependabot-auto-merge.yml`](./.github/workflows/dependabot-auto-merge.yml), which merges
the security updates GitHub raises; Renovate opens every other update. The published
[workflows page](./apps/docs/src/content/docs/infra/workflows.mdx) describes each job, and the environments, secrets
and rulesets behind them are settings, on the [environments](./apps/docs/src/content/docs/infra/environments.mdx) and
[secrets](./apps/docs/src/content/docs/infra/secrets.mdx) pages.

- **`Check` and `Check (docs)` are the contexts the ruleset requires**, each an aggregate under `always()` that fails
  when a job it needs failed or was cancelled; a job that must gate a merge goes in its `needs`.
- **`verify` runs on every push**, because the contract suite reads `CONTEXT.md`, `adr/` and every guide; `changes`
  gates only the deploys and the releases.
- **`smoke` runs the `@smoke` cases in [`apps/web/e2e/smoke.spec.ts`](./apps/web/e2e/smoke.spec.ts) against
  production**, with `BASE_URL` read from the `WEB_SITE_URL` **repository** variable (the job declares no
  `environment:`), the same value `deploy-production` passes as the deploy's `url`; a first step fails the job when
  it is empty. The step passes no `--pass-with-no-tests`, so a grep that stops matching fails the job. `release-web`
  needs it, and a failed smoke run rolls production back through `rollback`. The docs site has the same pair, over
  [`apps/docs/e2e/smoke.spec.ts`](./apps/docs/e2e/smoke.spec.ts) and the `DOCS_SITE_URL` variable.
- [`apps/web/e2e/warm-up.ts`](./apps/web/e2e/warm-up.ts) is Playwright's `globalSetup`: with `BASE_URL` set it requests
  the homepage and an unknown path once, before any worker starts, so no spec meets the Worker's first render.
- **The preview cleanup queues behind the run that deployed the Worker it deletes**: `cleanup-web` in the group
  `CI-refs/pull/<number>/merge`, which is the group `ci.yml` computes for that pull request's run, and `cleanup-docs`
  in the docs one. The coupling is by `ci.yml`'s `name:`, `CI`, so renaming it unqueues the cleanup; the contract suite
  compares the two. A weekly `sweep` deletes any preview Worker whose pull request is closed.
- **`docs-refresh` exists because the release commit carries `[skip ci]`**: the docs site renders the app version from
  `apps/web/package.json`, and without the dispatch it keeps advertising the previous one.

## Deploy

Both packages deploy to Cloudflare Workers through wrangler, each from its own `wrangler.toml`. Wrangler discovers the
config by walking up from the working directory and resolves every path in it relative to that file, which is why the
deploy steps `cd` into the package first. Each package previews one Worker per pull request, deleted when it closes.
The app's bindings, environments and the `NEXT_PUBLIC_SITE_URL` resolution are in
[`./apps/web/AGENTS.md`](./apps/web/AGENTS.md).

## Maintenance contract

These documents are not generated. When you change code, update the docs **in the same commit**: a follow-up commit is
a promise, not a fix.

| Document | Answers | Update it when |
| --- | --- | --- |
| [`CONTEXT.md`](./CONTEXT.md) (root only) | *What does this word mean?* A domain glossary, and nothing else | A domain term changes meaning, a new one appears, or a second name for an existing concept shows up in the code or the UI |
| [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) | *What does a review hold a diff to?* How code here is written, each rule hard or judgement | A convention changes, or a check lands that makes a rule mechanical |
| This file | *How is the repository put together?* Layout, shared tooling, releases, CI | You change the workspace, the release setup, a workflow, or a coupling that spans both packages |
| `apps/*/README.md` | *What is this package, and how do I run it?* | The package's capabilities, scripts or required setup change |
| `apps/*/AGENTS.md` | *What do I need while working here?* The agent-facing guide | You change a package's stack, commands, deployment, or a coupling or gotcha it states |
| `apps/web/src/**/AGENTS.md` | *What is in this folder, and what does a change here carry?* Its files, public API, couplings, gotchas and guardrails. Its `# ` heading is the folder's own path, repo-relative: `# apps/web/src/domain/calendar` | You change a layer's dependencies, a signature, a coupling, or the files in that folder |
| [`adr/`](./adr/) | *Why is it like this?* One decision per file | You make a decision that is hard to reverse, surprising without context, **and** the result of a real trade-off |
| [`README.md`](./README.md) | *What is this product and how do I run it?* The human-facing front page | The product's capabilities, the stack table, the scripts or the required versions change |
| [`BACKLOG.md`](./BACKLOG.md) | *Where does the tree break a rule today, and what fixes it?* The known breaches of `CODING_STANDARDS.md` | A change fixes an item (delete it), or leaves a breach it found in place (add it, with its fix) |

| If you change | Update |
| --- | --- |
| What a domain word means, or introduce a new one | [`CONTEXT.md`](./CONTEXT.md): the glossary, vocabulary only |
| A rule about how code is written | [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) |
| A folder's layout, the files a concept is made of, or a coupling or gotcha its guide states | that folder's nested `AGENTS.md` |
| A behaviour a doc states as a coupling or a gotcha | that bullet, or delete it if it stopped being true |
| A layer's allowed imports | the rule for it in `tests/docs-consistency.test.ts` and its line in `CODING_STANDARDS.md`, the ADR that decided the boundary, that layer's `AGENTS.md` where it lists them, and the counted layer table on the architecture overview |
| A package script, a path alias, or the folder tree | the *Commands* section here or in the package guide, and `README.md` if it lists the script |
| A translation key | every bundle under [`apps/web/src/ui/i18n/messages/`](./apps/web/src/ui/i18n/messages); parity is asserted |
| A decision an ADR records | that ADR: amend it, or supersede it with a new one and say so in both `## Status` blocks |
| A claim `tests/docs-consistency.test.ts` asserts, on purpose | the doc first; the test only when the claim itself is what changed |

[`tests/docs-consistency.test.ts`](./tests/docs-consistency.test.ts) holds these documents,
[CODING_STANDARDS.md](./CODING_STANDARDS.md) included, to the claims it can check against the repository (links,
cited files, scripts, aliases, workflows, ADR numbering and references, the glossary's shape, the published layer
table, the wiki's constants and tokens), plus the code rules `CODING_STANDARDS.md` lists as enforced. It runs inside
`pnpm test:ut`, so CI runs it on every pull request, and alone with `pnpm test:docs`; it reads staged and unstaged
files, so a rule fires before the offending file is committed. A failure means a document and the code disagree: fix
whichever one is wrong. It cannot check rationale, and that part is on you. A rule's title says what it holds, and
the comment above it, where there is one, says why.

A new ADR starts as a copy of [ADR 0000](./adr/0000-adr-template.md), the template, which says when a decision earns
one and where to link it from.

## Gotchas

- **Biome's `noConsole` is an error with no allowlist but the log sink**:
  [`logger.ts`](./apps/web/src/infrastructure/logging/logger.ts) writes every entry to `console` for the platform to
  export ([ADR 0018](./adr/0018-the-platform-is-the-log-transport.md)), through the one `overrides` entry that names
  it.
- **Biome's `--changed` selects nothing on `main`**: it diffs against `vcs.defaultBranch`, which is `main`, so there
  `pnpm format:changed` answers *Checked 0 files*. Reach for `format:all`, which reads the whole tree in well under a
  second.
- **Vitest declares its own empty `css.postcss`, and deleting it breaks `--changed` alone.**
  [`apps/web/postcss.config.mjs`](./apps/web/postcss.config.mjs) names its plugin as a string, which Next resolves and
  Vite does not, and `--changed` builds the module graph, which transforms the CSS imports. The Next build still reads
  `postcss.config.mjs` untouched.
- **Both release configs teach their parsers the `!` grammar through `parserOpts`**, which the contract suite holds
  equal: without it `feat(web)!: …` is analysed with no type and the job ends green having released nothing, while
  commitlint accepts the `!`. The `preset` route does not work here: the notes step dies on *Missing helper*. `!`
  means major on any type, as a `BREAKING CHANGE:` footer does.
- **The `v1` floating tag is stale and nothing maintains it.** When it diverges between local and remote,
  semantic-release's own `git fetch --tags` fails with *would clobber existing tag*.
- **The patched dependencies are off-limits to Renovate's automerge.** `boneyard-js` is keyed by bare name, so its
  patch applies to whatever version resolves and a bump that no longer patches what the diff was written against is
  silent; `vaul` is keyed with its version, so a bump fails the install. [`.github/renovate.json`](./.github/renovate.json)
  turns `automerge` off for both, and the contract suite asserts every patch has that rule.
- **`minimumReleaseAge` is declared twice**: `pnpm-workspace.yaml` in minutes (`4320` is three days),
  `.github/renovate.json` in days, and Renovate's has to stay the stricter, because the installer re-checks the age
  on every install. A security update is the case that hits it, since `dependabot-auto-merge.yml` merges one the hour
  its advisory lands: the escape hatch is an exact `name@version` in `minimumReleaseAgeExclude`, deleted once the
  release ages past the floor.
- **Renovate writes a comment into `pnpm-workspace.yaml`, and it stays.** When it exempts a security fix from
  `minimumReleaseAge`, renovate[bot] adds a `# Renovate security update: <pkg>@<version>` line beside the entry and
  never reads it back. It is bot output, like the lockfile: the contract suite's no-comment rule for YAML allows
  exactly that line, in that file alone, so removing it by hand only makes the next security PR write it again.
- **The contract suite reads YAML with the js-yaml that semantic-release brings in through cosmiconfig.** No package
  here declares a YAML parser, so the suite resolves it along that chain; if semantic-release stops bringing it, the
  YAML rules fail on that lookup rather than pass over an unread file.
- **An unrecognized key in `pnpm-workspace.yaml` is a hard install failure** (`ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS`)
  whenever the repository pins its installer, which this one does through `packageManager`.
- **Never run `lint-staged` by hand.** It stashes the whole tree, and interrupting it can revert the working copy. Let
  the hook run it.
- **On Windows an install that replaces an already-installed package fails with `Access is denied. (os error 5)`**,
  naming one package at a time. It is not a file lock: delete `node_modules` at the root and in both packages, then
  install. CI never sees it.
