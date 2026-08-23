# CLAUDE.md

Agent-facing guide for the **forever-pto** repository — a workspace holding the Forever PTO planner
and its documentation site. See [CONTEXT.md](./CONTEXT.md) for the domain glossary (PTO Day, Bridge,
Suggestion, Alternative, Effective Day, Efficiency, Donation…); do not duplicate it here, and use its
canonical names in code, copy and docs.

This file covers the repository: its layout, its shared tooling, how versions are cut and how CI is wired.
**The guide for the code you are about to touch is the package's own**, and it carries the detail this one
omits.

## Packages

| Package | Guide | What it is |
| --- | --- | --- |
| `apps/web` (`forever-pto`) | [`./apps/web/CLAUDE.md`](./apps/web/CLAUDE.md) | The planner. Next 16 App Router on Cloudflare Workers through OpenNext |
| `apps/docs` (`forever-pto-docs`) | [`./apps/docs/CLAUDE.md`](./apps/docs/CLAUDE.md) | docs.forever-pto.com. Astro Starlight, rendering the app's real components |

## Layout

```
apps/
  web/                Next 16 + React 19 + OpenNext → Cloudflare Workers
  docs/               Astro Starlight → Cloudflare Workers (static assets)
adr/                  Architecture decision records, one decision per file
tests/                docs-consistency, which asserts repo-wide contracts
patches/              patchedDependencies, applied by pnpm
.github/              Workflows and the prepare-env composite action
biome.json            Lint and format for both packages
CONTEXT.md            The domain glossary, root only
```

There is no `packages/` tier. It is added to [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) the day a real shared package exists,
not before — see [ADR 0010](./adr/0010-apps-web-and-apps-docs-monorepo-layout.md).

## Versions (pinned — match exactly)

- Node **26.3.0** (`.nvmrc`, mirrored in `engines.node`) — `.nvmrc` is what every CI job installs
- pnpm **11.21.0** (`packageManager`) — always use pnpm, never npm/yarn
- TypeScript **6** and Next **16.2** — pinned as a pair by the Cloudflare adapter. That constraint belongs
  to the app; the reasoning is in [`./apps/web/CLAUDE.md`](./apps/web/CLAUDE.md) and
  [ADR 0009](./adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md)

## Commands

Every command below runs from the repo root. The build and run scripts delegate to `apps/web`; the lint,
format and test scripts are root-owned because they span both packages.

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
pnpm test:ut:coverage   # apps/web with coverage, then the contract suite with coverage
pnpm test:e2e           # apps/web playwright
pnpm verify             # format:check && typecheck && test:ut:coverage; the CI Check job and pre-push
```

`pnpm --filter forever-pto-docs dev` runs the docs site; it has no root passthrough because nothing else
documents it as a repo-level command.

## Shared tooling

**One Biome config, at the root, for both packages.** `--changed` needs the git root to compare against,
and a single pass is what lints `apps/docs` now that its workflow no longer has a Biome step of its own.
Its `files.includes` exclusions are repo-relative paths, so any future move has to re-prefix them;
`tests/docs-consistency.test.ts` asserts every one that names a literal path still resolves. `.astro` files are excluded from the **linter** only: Biome parses just
their frontmatter, so every import used in the template body reads as unused. `astro check` covers them.

**One lockfile, at the root.** `.gitignore` carries `apps/*/pnpm-lock.yaml` so a stray per-package lockfile
cannot shadow the workspace resolution.

**The root package is `forever-pto-monorepo`, private, at `0.0.0`, with no dependencies.** A dependency
there would be installed for both packages and belong to neither. `tests/docs-consistency.test.ts` asserts
all three properties.

## Conventions

- **Use the glossary's words.** [CONTEXT.md](./CONTEXT.md) names one canonical term per concept and lists
  the retired ones. A variable called `vacationDays` where the glossary says PTO Day is a defect, not a
  style preference — the vocabulary is the only thing keeping four names for the same number apart.
- **No re-export barrel files.** Import from the source module; a pass-through `index.ts` hides the real
  dependency graph and defeats the layer rules.
- **Conventional commits** (commitlint + husky). semantic-release owns versioning. Do NOT add a
  Co-Authored-By / Claude trailer to commits or PRs.
- **One package per pull request.** The repo squash-merges, and a release is attributed to a package by the
  paths the commit touches, so a PR spanning both packages lands in both changelogs.

## Releases

Each package versions itself, through `semantic-release-monorepo`. A commit belongs to whichever package
its paths fall under, so a docs change never cuts an app release and vice versa.
[ADR 0011](./adr/0011-per-package-versioning-with-a-bridge-tag.md) records the decision and its costs.

| Package | Tags | Writes | Runs in |
| --- | --- | --- | --- |
| `apps/web` | `web-vX.Y.Z` | [`apps/web/package.json`](./apps/web/package.json), [`apps/web/CHANGELOG.md`](./apps/web/CHANGELOG.md), a GitHub release | [`ci.yml`](./.github/workflows/ci.yml), after the production deploy |
| `apps/docs` | `docs-vX.Y.Z` | a tag and a GitHub release, nothing else | [`docs.yml`](./.github/workflows/docs.yml), after the docs deploy |

`apps/docs` has no changelog, npm or git plugin on purpose: it pushes nothing to `main`, which is what keeps
the two release jobs from racing each other. Its package version stays `0.0.0` forever and nothing reads it —
the docs site displays the **app's** version.

**`web-v1.8.2` is a bridge tag and looks like debris.** It sits on the same commit as the older `v1.8.2` and
carries no annotation. semantic-release finds the last release by `tagFormat`; delete that tag and the next
app release publishes `web-v1.0.0` over a 1.8.x line, which cannot be recalled from GitHub Releases. The
`release-web` job fails loudly if no `web-v*` tag exists rather than letting it happen quietly.

**A change confined to the repo root releases nothing** — `adr/`, `tests/`, `README.md`, `CONTEXT.md`, this
file. That is correct and occasionally surprising. **It is narrower than it reads**: `WEB_PATHS` in `ci.yml`
also matches [`package.json`](./package.json), `pnpm-workspace.yaml`, [`biome.json`](./biome.json), `.npmrc`, `.nvmrc` and
`.github/actions/`, all of which do cut a release. That is deliberate — each of them changes what the app
builds from — but it means "the repo root" is not the boundary; the regex is.

## CI

**`ci.yml` holds the whole app graph**: `changes`, then `lint`, `typecheck` and `test` in parallel, then
`deploy-production` → `release-web` → `docs-refresh` on `main`, or `deploy-development` → `comment` / `e2e`
on a PR. Both deploy jobs call the shared [`_deploy-web.yml`](./.github/workflows/_deploy-web.yml). `docs.yml` holds the docs graph — `build`, then
`preview` on a PR or `deploy` → `release-docs` on `main`. The rest are [`cleanup-development.yml`](./.github/workflows/cleanup-development.yml), the
renovate auto-merge, a `zizmor` audit, and [`dependabot-auto-merge.yml`](./.github/workflows/dependabot-auto-merge.yml) — which is **dormant**: there is no
`.github/dependabot.yml` in the tree, so nothing ever triggers it. It is kept for the day one appears.

Every job that needs a toolchain uses the `.github/actions/prepare-env` composite — pnpm, the `.nvmrc` Node,
`setup-node`'s dependency cache and `pnpm install --frozen-lockfile` — rather than repeating five steps.
`checkout` stays in the job, because the release jobs need their own (`fetch-depth: 0` and the PAT).

**The install must not be filtered.** The docs site imports app sources through the `@ui` alias, and their
bare imports resolve from the package the *importing file* sits in. A `--filter forever-pto-docs` install
would leave `apps/web/node_modules` absent and the docs build would fail on a dependency it never declared.

**Jobs are scoped with step-level `working-directory`, never a job-level default.** A job default does not
reach a `uses:` step, and `nick-fields/retry` exposes no cwd input, so every command it wraps starts with an
explicit `cd "$GITHUB_WORKSPACE/apps/web"`. Some steps cannot be scoped at all because they resolve from
`GITHUB_WORKSPACE` — codecov's `files`, the artifact `path` inputs, `wrangler-action`'s `workingDirectory` —
and those had their inputs repointed instead.

**The `changes` job gates the web deploy and release on whether `apps/web` was touched**, so a docs-only or
markdown-only commit no longer redeploys production. It derives the answer from `git diff` rather than a
third-party filter action, because every other action here is pinned to a commit SHA and an unpinnable one
trips `zizmor`. It fails open. `lint`, `typecheck` and `test` stay unconditional — the contract suite reads
`CONTEXT.md`, `adr/` and every guide, so a markdown-only change must not slip past it.

**There is no `deploy-production.yml` and no `deploy-development.yml`, and that is the point.** They were
separate workflows on the same triggers, so they *raced* `ci.yml` instead of following it: semantic-release
only ever waited for lint, typecheck and test, and duly cut a tag, a GitHub release and a changelog entry for
a version that had just failed to reach production. Nothing in a workflow can wait on another workflow, so
the deploys had to become jobs. `release-web` needs `deploy-production`, which is what makes a release mean
*the version is live*. The same rule is why `release-docs` lives in `docs.yml` next to the docs deploy rather
than in `ci.yml`. `cancel-in-progress` is conditional on `github.event_name == 'pull_request'` for the same
reason: cancelling a superseded PR run is free, cancelling a `main` run kills a deploy or a release halfway.

**Each package has its own pair of GitHub environments** — `web-production`, `web-development`,
`docs-production`, `docs-development`. They were shared, which meant a docs deploy passed through whatever
gate protects web production and the app's `NEXT_PUBLIC_*` vars were visible to jobs with no use for them.

**Those four environments are settings, and the workflows point at them before the settings exist.** This
guide claimed the Cloudflare and release secrets were repository-level and therefore unaffected by the
rename. They are not: `gh secret list` returns exactly `CODECOV_TOKEN` and `PAT`, and everything else —
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `JWT_SECRET`, `STRIPE_*`, `RESEND_API_KEY`,
`TURSO_AUTH_TOKEN`, `CF_ACCESS_CLIENT_*` — is an **environment** secret on the old `development` and
`production`. So a job naming `web-development` gets empty strings, wrangler falls back to interactive
OAuth, opens a browser on a headless runner and times out after 120 seconds per attempt:

```
✘ [ERROR] Timed out waiting for authorization code, please try again.
Error: Failed to provision remote R2 bucket … wrangler login failed
```

Passing the secret explicitly in the caller's `secrets:` block does not rescue it. A caller job cannot
declare an `environment:`, so `${{ secrets.CLOUDFLARE_API_TOKEN }}` there resolves against repository
secrets only. The value that works on `main` comes from the *callee* job's own `environment: production`.

**Before this branch merges, four things have to happen in repo settings and none of them is a code
change:**

1. Create `web-production` and `docs-production` — they do not exist yet, so `deploy-production` will fail
   the same way the first time it runs on `main`.
2. Copy the secrets from `development`/`production` onto all four, plus `CF_ACCESS_CLIENT_ID` and
   `CF_ACCESS_CLIENT_SECRET` on `web-development`, which `e2e` reads to reach a preview behind Cloudflare
   Access.
3. Move the `NEXT_PUBLIC_*` vars onto the two `web-*` environments.
4. Change ruleset `main` (`required_deployments`) from `development` to `web-development`. It is a merge
   gate, so even a green deploy to `web-development` leaves the pull request blocked until it names the
   environment the branch actually deploys to.

The alternative is to revert the rename in `ci.yml`, `docs.yml` and `cleanup-development.yml` and keep one
shared pair, which is what the split exists to stop.

**`deploy-tail` is gated on its own files.** The tail consumer is a second Worker with its own `wrangler.toml`; the app declares it in `[[tail_consumers]]` but does not carry it. It changes rarely, so it deploys only when `apps/web/workers/tail/**` does.

**`cross-package-notice` is advisory, not a gate.** A pull request touching both packages lands in both
changelogs, because attribution is by path and `main` takes squash merges. Sometimes that is what you
want, so the job posts a sticky comment saying what will happen and does not fail the run.

**`cleanup-development.yml` shares `ci.yml`'s concurrency group, which is what stops it deleting a Worker
that is still under test.** It fires on `pull_request: closed`, and closing a pull request does not cancel
the run already going: `e2e` needs `deploy-development` and drives the per-PR Worker over the network, so
the delete raced it and turned every remaining spec into a "There is nothing here yet" placeholder — one run
on #343 reported 47 failures with nothing wrong in the code. Renovate is how it happens, because it
auto-merges on the required checks and `e2e` is not one of them.

The fix is a queue, not a wait loop: the cleanup declares `group: CI-${{ github.ref }}` with
`cancel-in-progress: false`. `ci.yml`'s group is `${{ github.workflow }}-${{ github.ref }}`, and a
`pull_request` event carries the same `refs/pull/<number>/merge` whichever activity type fired it, so the two
strings match and GitHub holds the cleanup pending until the CI run completes. A pending run occupies no
runner, so this costs nothing. **The coupling is by workflow *name*** — renaming `ci.yml`'s `name: CI`
silently unqueues the cleanup and the race comes back. A concurrency group is per run, so the whole workflow
queues and `cleanup-docs` rides along; that is harmless, and it needs no wait of its own since the docs smoke
tests run against the build artifact before the preview Worker exists.

**`docs-refresh` exists because the release commit carries `[skip ci]`.** The docs site renders the app
version from `apps/web/package.json`; without a dispatch after a web release, the published site keeps
advertising the previous one.

Husky runs `lint-staged` on `pre-commit`, `commitlint` on `commit-msg` and `verify` on `pre-push` — the same
command the CI Check job runs, so a green push is a green check.

**`typecheck` ends with `astro check`, and that tail is what puts the cross-package seam in front of
the author.** The docs site typechecks the 32 demo components against `apps/web`'s real props — a renamed
`Button` variant fails there because `ButtonDemo`'s `Record<ButtonVariant, string>` is exhaustive — but the
check used to run only inside `docs.yml`'s `build` job. So an app PR that broke the docs passed `pre-push`,
passed the `CI` workflow, and failed in a workflow called **Docs** that does not read as blocking. Whether it
*was* blocking depended on branch protection, and this repo has already been bitten once by the required
checks not including the one that mattered.

**What that tail does *not* cover is a `@ui/…` specifier pointing at nothing.** Moving a component between folders under `apps/web/src/ui/` left a demo importing the old path; `astro check` reported zero errors and only `astro build` failed, in the Docs workflow, after the app's CI had gone green. `tests/docs-consistency.test.ts` resolves every one of those specifiers now.

## Deploy

Both packages deploy to Cloudflare Workers through wrangler, each from its own `wrangler.toml`. Wrangler
discovers the config by walking up from the working directory and resolves every path in it relative to
that file, which is why the deploy steps `cd` into the package first.

The app's bindings, environments and the `NEXT_PUBLIC_SITE_URL` resolution are in
[`./apps/web/CLAUDE.md`](./apps/web/CLAUDE.md).

**Both packages preview the same way: one Worker per pull request, deleted when it closes.** `apps/web`
deploys `pr-<number>-forever-pto-development` from `_deploy-web.yml`, `apps/docs` deploys
`pr-<number>-forever-pto-docs-development` from the `preview` job in `docs.yml`, and
`cleanup-development.yml` carries a job for each. What differs is only what the docs site does *not* need:
it has no bindings and no secrets, so its deploy has no `wrangler secret bulk` step and no `--var`
override, and it ships the `docs-dist` artifact the `build` job already produced rather than building a
second time.

## Maintenance contract

These documents are not generated. A change that does not update them leaves the tree describing code that
no longer exists, so when you change code, update the docs **in the same commit** — a follow-up commit is a
promise, not a fix.

| Document | Answers | Update it when |
| --- | --- | --- |
| [`CONTEXT.md`](./CONTEXT.md) (root only) | *What does this word mean?* A domain glossary, and nothing else — no file names, no libraries, no implementation detail | A domain term changes meaning, a new one appears, or a second name for an existing concept shows up in the code or the UI |
| This file | *How is the repository put together?* Layout, shared tooling, releases, CI | You change the workspace, the release setup, a workflow, or a rule that spans both packages |
| `apps/*/README.md` | *What is this package, and how do I run it?* The human-facing front page for one package |
| `apps/*/CLAUDE.md` | *What may I change here, and what are its rules?* The agent-facing guide | You change a package's stack, commands, deployment or its own conventions. Both files, and they answer different questions |
| `apps/web/src/**/CLAUDE.md` | *What may I touch here, and how is this folder built?* Layer contract at a layer root; files, public API, invariants and gotchas below it. Its `# ` heading is the folder's own path, repo-relative — `# apps/web/src/domain/calendar`, never `# domain/calendar` | You change a layer's dependencies, a signature, an invariant, or the files in that folder |
| [`adr/`](./adr/) | *Why is it like this?* One decision per file | You make a decision that is hard to reverse, surprising without context, **and** the result of a real trade-off. If any of the three is missing, skip the ADR |
| [`README.md`](./README.md) | *What is this product and how do I run it?* The human-facing front page | The product's capabilities, the stack table, the scripts or the required versions change |

| If you change | Update |
| --- | --- |
| What a domain word means, or introduce a new one | [`CONTEXT.md`](./CONTEXT.md) — the glossary, vocabulary only |
| A folder's layout, the files a concept is made of, or a rule its guide states | that folder's nested `CLAUDE.md` |
| A behaviour a doc states as an invariant or a gotcha | that bullet, or delete it if it stopped being true |
| A layer's allowed imports | that layer's `CLAUDE.md`, and the ADR that decided the boundary |
| A package script, a path alias, or the folder tree | the *Commands* section here or in the package guide, and `README.md` if it lists the script |
| A translation key | all six bundles under `apps/web/src/ui/i18n/messages/` — parity is asserted |
| A decision an ADR records | that ADR — amend it, or supersede it and say so in both `## Status` blocks |

[`tests/docs-consistency.test.ts`](./tests/docs-consistency.test.ts) makes the mechanical half of that
contract executable. It runs with `pnpm test:ut` (so, in CI on every PR) and asserts: that `CONTEXT.md`
exists only at the root, is linked from here, and stays a glossary — no backticked token holding a path, a
call signature or a source-file name, every term defined, no empty `_Avoid_` list, no term listing itself as
its own alternative; that the workspace globs resolve, both packages are members with their own manifests,
the root stays private and dependency-free at `0.0.0`, neither package carries its own Biome config or
lockfile, and every literal path Biome's `files.includes` excludes still resolves; that every layer root has a `CLAUDE.md`, that both package guides exist and are listed here, and
that every guide under `apps/web/src` is listed in the web package's own table; that ADRs are named
`NNNN-slug.md`, numbered contiguously from `0001`, carry the template's sections, and are each linked from
some document **outside** `adr/` — an ADR nothing points at will not be read; that every relative markdown
link resolves, every `.ts`/`.tsx` file named in backticks still exists, no document cites a nested
`CONTEXT.md`, and every symbol the published wiki's `tsx` fences import from `@ui/…` is still exported by the
module they name — that last one is the largest slice of the cross-package seam and had nothing checking it,
because `astro check` registers no MDX plugin and the citation rules match paths rather than symbols; that
every script this file
documents exists in the root manifest and every script the web guide documents exists in one of the two;
that [`apps/web/tsconfig.json`](./apps/web/tsconfig.json) keeps the two settings `next build` would otherwise fill in for it — `strict`
on and `allowJs` off — that it sits beside the [`next.config.ts`](./apps/web/next.config.ts) that rewrites it, and that
`cloudflare-env.d.ts` stays both excluded from the program and ignored by git; that every `'use client'`,
`'use server'` and `'use cache'` under either package's `src/` is a bare string literal in first position;
and that every locale bundle has exactly the keys [`en.json`](./apps/web/src/ui/i18n/messages/en.json) has.

It reads staged *and* unstaged files, so a rule fires before the offending file is committed. **Each rule was
verified by breaking it and confirming the matching case fails** — keep that property when you add one. A
failure means the docs and the code disagree; fix whichever is wrong. It cannot check rationale — whether an
explanation is honest — and that part is on you.

Two traps worth naming: deleting a resolved entry from a "known inconsistencies" list is part of the fix, not
tidying to do later; and a `file.ts:123` citation rots the moment anything above it moves — name the symbol
instead.

Propose an ADR when a decision is **hard to reverse**, **surprising without context** and **the result of a
real trade-off**. All three, or it is not an ADR. Copy [ADR 0000](./adr/0000-adr-template.md), number it one
above the highest existing file, and link it from wherever it bites — a gotcha here, a package guide, a
`CONTEXT.md` entry.

`CONTEXT.md` is reserved for the root glossary. **Never create a nested one** — the name would mean two
things, and the `domain-modeling` skill reads it as vocabulary and would rewrite a layer contract as a term
list. `tests/docs-consistency.test.ts` asserts no document *cites* one either: the published wiki taught the
opposite under a heading of "CONTEXT.md per folder" and named five paths that have never existed, which the
relative-link rule could not catch because they were prose rather than links.

## Gotchas

- **Biome's `noConsole` is an error with no allowlist** — no `console` at any level, so a stray `console.log`
  fails the build rather than shipping. The BetterStack client's own unconfigured warning is the single
  exception, scoped in `biome.json`'s `overrides`: it is the logger, so it has nothing else to call.
- **`format:changed` and `lint:changed` pass `--changed`, which means "changed against `main`".** On a
  branch that moves or renames a large number of files that is every one of them, and a `pre-commit` hook
  will happily reformat and stage files the commit was never about.
- **The `v1` floating tag is stale and nothing maintains it.** It diverges between local and remote, which
  makes semantic-release's own `git fetch --tags` fail outright with *would clobber existing tag*. No
  workflow moves it and no ADR records it.
- **`boneyard-js` is patched, so Renovate must not automerge it.** `pnpm-workspace.yaml` keys
  `patchedDependencies` by bare name, with no version, so the patch is applied to whatever version resolves.
  A bump that still applies cleanly but no longer patches what the diff was written against is silent — the
  install succeeds and CI stays green. [`.github/renovate.json`](./.github/renovate.json) therefore carries a `boneyard-js` rule turning
  `automerge` off, against the blanket patch/minor automerge above it; a human reads the upstream diff. It is
  the only dependency in the tree with a patch, and a second one needs the same rule.
- **`minimumReleaseAge` is declared twice and nothing keeps the two in step.** `pnpm-workspace.yaml` says
  4320 minutes (3 days), `.github/renovate.json` says 4 days. Renovate being the stricter of the two is what
  makes it safe: it cannot open a pull request for a release the installer would then refuse. Lower it below
  the workspace's and CI fails on the lockfile rather than at resolution, because the age is re-checked on
  **every** install and not only when a version is picked.
- **An import sorted above a `'use client'` silently deletes it, and only `next build` notices.** Biome's
  import sorting moves an added import to the top of the file; the directive then stops being the first
  statement, and the formatter parenthesises the orphaned string, leaving `('use client');`. That is an
  ordinary expression — the module becomes a Server Component. Typecheck, Biome and the whole unit suite
  stay green, because none of them models the RSC boundary. Six planner files sat like that for several
  commits. `tests/docs-consistency.test.ts` parses for it now, in both shapes.
- **Never run `lint-staged` by hand.** It stashes the whole tree; interrupting it can revert the working
  copy. Let the hook run it.
