# CLAUDE.md

Agent-facing guide for the **forever-pto** repository, a workspace holding the Forever PTO planner
and its documentation site. See [CONTEXT.md](./CONTEXT.md) for the domain glossary (PTO Day, Bridge,
Suggestion, Alternative, Effective Day, Efficiency, Donation…); do not duplicate it here, and use its
canonical names in code, copy and docs.

This file covers the repository: its layout, its shared tooling, how versions are cut and how CI is wired.
**The guide for the code you are about to touch is the package's own**, and it carries the detail this one
omits.

## Packages

| Package | Guide | What it is |
| --- | --- | --- |
| [`apps/web`](./apps/web) (`forever-pto-web`) | [`./apps/web/CLAUDE.md`](./apps/web/CLAUDE.md) | The planner. Next App Router on Cloudflare Workers through OpenNext |
| [`apps/docs`](./apps/docs) (`forever-pto-docs`) | [`./apps/docs/CLAUDE.md`](./apps/docs/CLAUDE.md) | docs.forever-pto.com. Astro Starlight, rendering the app's real components |

## Layout

```
apps/
  web/                Next + React + OpenNext → Cloudflare Workers
  docs/               Astro Starlight → Cloudflare Workers (static assets)
adr/                  Architecture decision records, one decision per file
tests/                docs-consistency, which asserts repo-wide contracts
patches/              patchedDependencies, applied by pnpm
.github/              Workflows and the prepare-env composite action
biome.json            Lint and format for both packages
CONTEXT.md            The domain glossary, root only
```

There is no `packages/` tier. It is added to [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) the day a real shared package exists,
not before; see [ADR 0010](./adr/0010-apps-web-and-apps-docs-monorepo-layout.md).

## Versions

**This section names where each version is pinned and never what the pin says.** A digit written here is a
claim a bot invalidates on its own, and neither way of defending it works: contribKit asserted the digit
against the manifest and failed every dependency pull request on `CLAUDE.md does not state Flutter 3.47.2`, a
line the bot cannot edit; this guide did not assert it and carried two stale pins instead, Node and pnpm.
Read the manifest. What `tests/docs-consistency.test.ts` asserts is the shape a bump cannot change, and that reaches every document now: none outside `adr/` names a runtime or a framework beside a version, with the handful of sentences that narrate a past bump by its number allow-listed by name. The two `wrangler-action` inputs in `docs.yml` that used to carry a wrangler literal read it out of `apps/docs/package.json` at run time, which is what turned the rule that compared the two from a check that failed every wrangler bump into one that cannot.

- Node ([`.nvmrc`](./.nvmrc), mirrored in `engines.node`): `.nvmrc` is what every CI job installs, and the
  two spellings are asserted equal
- pnpm (`packageManager`, and in no workspace manifest): always use pnpm, never npm/yarn
- TypeScript at the root and in `apps/web` moves as one; `apps/docs` stays on **6**, because `astro check`
  refuses to run under 7: the native compiler ships no programmatic API for it to load. The split is asserted
  rather than assumed, and it closes the day Astro supports 7
- Next with `@opennextjs/cloudflare` ([`apps/web/package.json`](./apps/web/package.json)): they move as a
  pair, and the pair is what lifted the pin
  [ADR 0009](./adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md) recorded. That ADR is dated and quotes
  the versions it decided on, which is what an ADR is for. The reasoning belongs to the app:
  [`./apps/web/CLAUDE.md`](./apps/web/CLAUDE.md)

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

**The Check job's summary shows two Vitest reports, and they are two different suites.** `test:ut:coverage`
is a chain: the app package's unit suite first, then the root Vitest, which collects only
`tests/docs-consistency.test.ts`. Each invocation appends its own *Vitest Test Report* block to the job
summary, under a heading that is a constant inside Vitest's `github-actions` reporter with no option to
rename it, so both configs register `summaryLabel` from the root [`vitest.config.ts`](./vitest.config.ts),
a reporter whose whole job is writing the suite's own heading above its block, on CI only. Neither block
duplicates the other; the labels are what say so without counting tests.

**Coverage has a floor of 85 on all four metrics, and it sits on the app package's config alone.**
[`apps/web/vitest.config.ts`](./apps/web/vitest.config.ts) declares `thresholds` from one `MIN_THRESHOLD`
const, the same shape and the same number the sibling repositories use, so a package that drifts below it
fails `verify` rather than being noticed in a report nobody opens. The measured margin when it was added was
comfortable, and branches is the tight one: a change that guts a branch-heavy module trips this before it
trips a reviewer.

**The root config deliberately has none, and the reason is worth knowing before adding one.** The root
Vitest collects `tests/docs-consistency.test.ts`, which imports `next.config.ts` to read `PUBLIC_ENV`, and it
declares no `coverage.include`, so the only file the report ever covers is that config, at a fraction of its
branches. That number measures nothing, and a floor over it would fail every run. Restricting or dropping the
root's coverage collection is the real fix; until then, read the second report as an artifact rather than a
measurement.

## Shared tooling

**One Biome config, at the root, for both packages.** `--changed` needs the git root to compare against,
and a single pass is what lints `apps/docs` now that its workflow no longer has a Biome step of its own.
The docs manifest carries no Biome scripts either: it held a copy of the root's eight, nothing ran them, and
the two `--changed` ones could not have worked from a package directory.
Its `files.includes` exclusions are repo-relative paths, so any future move has to re-prefix them;
`tests/docs-consistency.test.ts` asserts every one that names a literal path still resolves. `.astro` files are excluded from the **linter** only: Biome parses just
their frontmatter, so every import used in the template body reads as unused. `astro check` covers them.

**One lockfile, at the root.** [`.gitignore`](./.gitignore) carries `apps/*/pnpm-lock.yaml` so a stray per-package lockfile
cannot shadow the workspace resolution.

**The root package is `forever-pto-monorepo`, private, at `0.0.0`, with no dependencies.** A dependency
there would be installed for both packages and belong to neither. `tests/docs-consistency.test.ts` asserts
all three properties.

## Conventions

- **Use the glossary's words.** [CONTEXT.md](./CONTEXT.md) names one canonical term per concept and lists
  the retired ones. A variable called `vacationDays` where the glossary says PTO Day is a defect, not a
  style preference; the vocabulary is the only thing keeping four names for the same number apart.
- **The strategic half of domain-driven design is a constraint here; the tactical half is a technique.**
  The glossary rules the names, the two bounded contexts under [`apps/web/src/domain`](./apps/web/src/domain)
  stay separate, the layer boundaries hold, and the dependency graph is *measured* against the tree rather
  than drawn from the intent. Everything tactical is applied only where it pays, decided by three questions
  in order: is the illegal state reachable, does anyone read it, does it cross a boundary. Three "no" means
  writing the rule rather than encoding it, and the written rule is finished work. Which practices are taken,
  which are taken in part and which are rejected is
  [ADR 0014](./adr/0014-ddd-where-it-pays.md), with six worked examples out of this
  repository and the reason each was decided the way it was. The absences are deliberate: no aggregates, no
  repository pattern, no entities, no event bus, and a domain that imports upward in two documented places.
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
| `apps/docs` | `docs-vX.Y.Z` | a tag and a GitHub release, nothing else | [`docs.yml`](./.github/workflows/docs.yml), after the docs deploy and its smoke run |

`apps/docs` has no changelog, npm or git plugin on purpose: it pushes nothing to `main`, which is what keeps
the two release jobs from racing each other. Its package version stays `0.0.0` forever and nothing reads it:
the docs site displays the **app's** version.

**There are two bridge tags, `web-v1.8.2` and `web-v1.8.3`, and the first looks like debris.** Each sits on
the same commit as the legacy `v1.8.x` tag of the same number. semantic-release finds the last release by
`tagFormat`, which is `web-v${version}`; delete the highest one and the next app release publishes
`web-v1.0.0` over a 1.8.x line, which cannot be recalled from GitHub Releases. The `release-web` job fails
loudly if no `web-v*` tag exists rather than letting it happen quietly.

`web-v1.8.2` carries no annotation, which is why it reads as debris and why this paragraph exists.
`web-v1.8.3` is annotated with its own reason, so `git show web-v1.8.3` answers the question without a guide.
Annotate the next one too.

**`web-v1.8.3`'s number matches what is live and its content does not, deliberately.** The 1.8.3 changelog
entry lists one fix, the Renovate bump of Next to 16.3.1, which this branch reverted for the whole of
[ADR 0009](./adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md). The branch carries 16.3.3 now, with the
adapter that admits it, so the entry and the tree agree again on the major and minor and still not on the
patch. The tag exists so the next release continues from 1.8.3 rather than re-cutting it and writing a second
1.8.3 section into a changelog that already has one.

**Both tags are on the remote**, verified with `git ls-remote --tags origin 'web-v*'` on 2026-08-24. They had
to reach it before `release-web` first runs on `main`, and they have. This paragraph used to say they were
still local; that is the shape of claim to re-check rather than copy forward.

**A `web-v*` tag on a commit `main` cannot reach is worse than a missing one, and `web-v1.9.3` was one.**
semantic-release finds the last release with `git tag --merged`, so a tag whose commit is not an ancestor of
the release branch is invisible to it: it read the last release as 1.9.2, computed 1.9.3 again, and then died
on `fatal: tag 'web-v1.9.3' already exists`, because the tag it could not *see* is still one `git tag` refuses
to overwrite. That is a permanent stop rather than one bad run: every later push repeats it, and `release-web`
is what `docs-refresh` hangs off. It happens when the release commit `@semantic-release/git` pushes is later
rebased away while its tag stays put, which is exactly what a force-push to `main` under a release does.

**It could not be repaired by moving the tag**, and that is worth knowing before reaching for the obvious fix:
the GitHub Release carrying it is `immutable`, so the API answers `403` to a force-update of the ref and to a
delete. What repaired it is a `git merge -s ours` of the orphaned release commit into `main`, which makes the
tag reachable and changes no file, since `main` already carried the same work under a different sha. The
alternative was a bridge tag one patch higher, which would have skipped a version number and claimed a release
that never happened; grafting keeps the numbers honest. Prefer it, and never force-push `main` while a release
is in flight.

**A change confined to the repo root releases nothing**: `adr/`, `tests/`, `README.md`, `CONTEXT.md`, this
file. That is correct and occasionally surprising. **It is narrower than it reads**: `WEB_PATHS` in `ci.yml`
also matches [`package.json`](./package.json), `pnpm-workspace.yaml`, [`patches/`](./patches), [`biome.json`](./biome.json), `.nvmrc` and
[`.github/actions/`](./.github/actions), all of which do cut a release. That is deliberate (each of them changes what the app
builds from), but it means "the repo root" is not the boundary; the regex is.

## CI

**`ci.yml` holds the whole app graph**: `changes` and `verify` in parallel, then
`deploy-production` → `release-web` → `docs-refresh` and `deploy-production` → `smoke` on `main`, or
`deploy-development` → `comment` / `e2e` on a PR, and a final `check` job that aggregates every one of them. Both deploy jobs call the shared [`_deploy-web.yml`](./.github/workflows/_deploy-web.yml). `docs.yml` holds the docs graph: its own `changes`, then `build`, then
`preview` on a PR or `deploy` → `smoke` → `release-docs` on `main`, with `rollback` when that smoke run fails, and its own aggregate, `Check (docs)`. The rest are [`cleanup-development.yml`](./.github/workflows/cleanup-development.yml), a [`zizmor.yml`](./.github/workflows/zizmor.yml) audit,
[`dependency-review.yml`](./.github/workflows/dependency-review.yml), [`commit-message.yml`](./.github/workflows/commit-message.yml), and
[`dependabot-auto-merge.yml`](./.github/workflows/dependabot-auto-merge.yml), which **does fire, and only for
security updates**. There is no `.github/dependabot.yml` in the tree, so Dependabot opens no version-update pull
requests here, Renovate does that; but the security updates GitHub raises from the alerts need no config file,
and they are what that workflow merges.

**`commit-message.yml` lints the pull request *title*, which is the guard the two rules above depend on.**
`main` takes squash merges, so the title becomes the commit semantic-release parses; the *Conventional
commits* convention and the *One package per pull request* release rule are both enforced there and nowhere
else. It was missing from this list, which is how a rule can look enforced and not be.

Every job that needs a toolchain uses the [`.github/actions/prepare-env`](./.github/actions/prepare-env) composite (pnpm, the `.nvmrc` Node,
`setup-node`'s dependency cache and `pnpm install --frozen-lockfile`) rather than repeating five steps.
`checkout` stays in the job, because the release jobs need their own (`fetch-depth: 0` and the PAT).

**The install must not be filtered.** The docs site imports app sources through the `@ui` alias, and their
bare imports resolve from the package the *importing file* sits in. A `--filter forever-pto-docs` install
would leave `apps/web/node_modules` absent and the docs build would fail on a dependency it never declared.

**Jobs are scoped with step-level `working-directory`, never a job-level default.** A job default does not
reach a `uses:` step, and `nick-fields/retry` exposes no cwd input, so the two preview deletes in
`cleanup-development.yml`, the last commands still wrapped in it, each start with an explicit
`cd "$GITHUB_WORKSPACE/apps/<package>"`. Some steps cannot be scoped at all because they resolve from
`GITHUB_WORKSPACE` (codecov's `files`, the artifact `path` inputs, `wrangler-action`'s `workingDirectory`),
and those had their inputs repointed instead.

**The `changes` job gates the web deploy and release on whether `apps/web` was touched**, so a docs-only or
markdown-only commit no longer redeploys production. It derives the answer from `git diff` rather than a
third-party filter action, because every other action here is pinned to a commit SHA and an unpinnable one
trips `zizmor`. It fails open. `lint`, `typecheck` and `test` stay unconditional: the contract suite reads
`CONTEXT.md`, `adr/` and every guide, so a markdown-only change must not slip past it.

**There is no `deploy-production.yml` and no `deploy-development.yml`, and that is the point.** They were
separate workflows on the same triggers, so they *raced* `ci.yml` instead of following it: semantic-release
only ever waited for lint, typecheck and test, and duly cut a tag, a GitHub release and a changelog entry for
a version that had just failed to reach production. Nothing in a workflow can wait on another workflow, so
the deploys had to become jobs. `release-web` needs `deploy-production`, which is what makes a release mean
*the version is live*. The same rule is why `release-docs` lives in `docs.yml` next to the docs deploy rather
than in `ci.yml`. `cancel-in-progress` is conditional on `github.event_name == 'pull_request'` for the same
reason: cancelling a superseded PR run is free, cancelling a `main` run kills a deploy or a release halfway.

**Each package has its own pair of GitHub environments**: `web-production`, `web-development`,
`docs-production`, `docs-development`. They were shared, which meant a docs deploy passed through whatever
gate protects web production and the app's `NEXT_PUBLIC_*` vars were visible to jobs with no use for them.

**Those four environments are settings, and the workflows point at them before the settings exist.** This
guide claimed the Cloudflare and release secrets were repository-level and therefore unaffected by the
rename. They are not: `gh secret list` returns exactly `CODECOV_TOKEN` and `PAT`, and everything else
(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `JWT_SECRET`, `STRIPE_*`, `RESEND_API_KEY`,
`TURSO_AUTH_TOKEN`, `CF_ACCESS_CLIENT_*`) is an **environment** secret on the old `development` and
`production`. So a job naming `web-development` gets empty strings, wrangler falls back to interactive
OAuth, opens a browser on a headless runner and times out after 120 seconds per attempt:

```
✘ [ERROR] Timed out waiting for authorization code, please try again.
Error: Failed to provision remote R2 bucket … wrangler login failed
```

Passing the secret explicitly in the caller's `secrets:` block does not rescue it. A caller job cannot
declare an `environment:`, so `${{ secrets.CLOUDFLARE_API_TOKEN }}` there resolves against repository
secrets only. The value that works on `main` comes from the *callee* job's own `environment: production`.

**All four environments carry what their jobs read, and this guide said otherwise for a week.** The Cloudflare token and account id are on every one of them, `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are on `web-development`, and the evidence is the runs rather than a settings page nobody can read from outside: `deploy-development` and `e2e` succeed on pull requests, and `deploy-production` shipped 1.9.7. The `docs-*` pair needs no Access secret, because nothing in `docs.yml` requests the docs preview — its `PREVIEW_URL` is only written into the pull request comment, and the docs Playwright suite runs against a local preview in `build`. This paragraph used to be an *Outstanding* item saying the secrets were missing; a claim like that is the kind to re-check against a run rather than copy forward.

**The docs preview needs an Access destination even though it needs no secret, and it was missing one.** The
Access application matches `pr-*-forever-pto-development`; the docs preview is
`pr-*-forever-pto-docs-development`, which that pattern does not match, so every docs preview was publicly
reachable. That is worse than it sounds, because [`apps/docs/public/robots.txt`](./apps/docs/public/robots.txt)
says `Allow: /` and advertises the **production** sitemap, so each preview invited crawlers to index a
duplicate of `docs.forever-pto.com`. The published wiki asserted the opposite — *every PR preview sits behind
Zero Trust Access, which is why nothing crawls a preview* — and that sentence is what made the gap findable.
The fix is a second destination on the same Access application, so the docs preview inherits the `Allow` and
`Service Auth` policies already on it. It cannot be fixed in this tree: `build` produces one `docs-dist`
artifact that both `preview` and `deploy` ship, the docs build reads no environment variable, and
`apps/docs` serves static assets with no Worker, so there is no build-time switch and no per-environment
header to fall back on.

Already true, and this list said otherwise:

- All four environments exist.
- The five runtime secrets (`JWT_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `TURSO_AUTH_TOKEN`) are on both `web-*`. The `docs-*` pair needs none of them, only the Cloudflare two.
- The seven `NEXT_PUBLIC_*` vars are on both `web-*`.
- There is **no `required_deployments` rule** on ruleset `main`, so there is nothing to repoint. Its
  `required_status_checks` are `Check`, `Check (docs)`, `zizmor`, `Lint the pull request title` and `Dependency Review`, the same set every sibling repository names, plus the docs aggregate this one has because it deploys two sites. `zizmor` is the check run the action publishes through code scanning, not the `Run zizmor` job: the job passes whatever it finds, and only the code-scanning check turns red on a finding. No approval is required, which is why `renovate-auto-approve.yml` is gone: the owner is the only reviewer, the checks are the gate, and Renovate merges through the platform once they are green. Two settings outside that ruleset complete it: `release-tags`, a tag ruleset that forbids deleting or moving any `web-v*` or `docs-v*` tag (semantic-release creates them with the owner's `PAT`, which passes the admin bypass), and a deployment-branch policy of `main` only on `web-production` and `docs-production`, so a job naming either environment from any other ref fails before its first step.

**`E2E (preview)` gates a merge through `Check`, and for a month it did not, which is the hole two separate incidents came through.** It is what
catches the Cloudflare Error 1101 the Next pin exists to prevent, and Renovate auto-merged 16.3.1 straight
past it on 2026-08-22, into the deploy production ran until 1.9.x; pull request 384 merged on 2026-09-01 while the suite was still red. A version pin does not hold against a bot with automerge rights, which is what
makes this check the missing half of [ADR 0009](./adr/0009-next-16-2-pinned-by-the-cloudflare-adapter.md)
rather than a nicety. It cannot be named in the ruleset directly: every job in `ci.yml` is conditional on the event, and a required check that never reports blocks the merge forever. So `check` is an aggregate under `always()` that needs `verify`, both deploys, `e2e`, `deploy-tail`, `smoke` and `release-web`, fails when any of them failed or was cancelled, and counts a skipped one as success. `docs.yml` has the same shape as `Check (docs)`, over its own `changes`, `build`, `preview`, `deploy`, `smoke` and `release-docs`, which is what made the docs pipeline requireable at all: a path-filtered workflow never reports on a pull request outside its paths, so `docs.yml` carries no `paths:` any more and its `changes` job gates `build` on the same list, `DOCS_PATHS`, instead. **The suite has to be green to hold that power**, and its one flaky case was environmental: the per-request `/_not-found` route on a preview Worker that had never been hit timed out at 30 s. [`apps/web/e2e/warm-up.ts`](./apps/web/e2e/warm-up.ts) is Playwright's `globalSetup`: with `BASE_URL` set it requests the homepage and one unknown path once, with a long timeout, before any worker starts, so the first render a spec sees is not the Worker's first ever.

**`deploy-tail` is gated on the files its bundle is built from, which is wider than its own folder.** The tail consumer is a second Worker with its own `wrangler.toml`; the app declares it in `[[tail_consumers]]` but does not carry it. It changes rarely, so `TAIL_PATHS` gates it, but `workers/tail/index.ts` imports the log-level contract from `apps/web/src/infrastructure/clients/logging/`, and while the filter named only `apps/web/workers/tail/**` a change to that contract redeployed the app and left the Worker running the old bundled copy. The Worker's own unit test reads the source module, so it could not see the split. `tests/docs-consistency.test.ts` walks that import graph **transitively** against `TAIL_PATHS` now (one level is not enough, because whatever the contract itself imports is bundled too) and asserts at least one resolved path lands outside `workers/tail/`, since the Worker test's own `./index` import would otherwise make an empty walk look like a successful one. **A reach the walk cannot resolve fails the rule.** It appended `.ts` and nothing else, so a directory specifier standing for the `index.ts` inside it, and a NodeNext `./foo.js`, each produced a path that does not exist, and the final assertion was guarded by `existsSync`, which exempted precisely those. The floor did not notice either: one unresolvable entry is itself an entry outside `workers/tail/`. `ci.yml` also answers
`workflow_dispatch`, and a manual dispatch on `main` is the credential-rotation path: it runs `deploy-tail`
unconditionally and `deploy-production` with `smoke` behind it, because every credential is read at build or
deploy time — the Worker secrets ride `--secrets-file`, the public variables are inlined by the build, and
the tail Worker takes its token and host as deploy arguments — so rotating any of them changes no file,
matches no path filter, and used to leave the old value live until an unrelated commit came along.
`release-web` stays push-gated: a dispatch redeploys the same sha and there is nothing to version. The
push-triggered gates are unchanged.

**`smoke` is the only job that ever touches production, and until this branch there was none.** `e2e` needs
`deploy-development`, which runs on `pull_request` only, so a push to `main` deployed production, cut a tag
and made no request to `https://forever-pto.com` at all. The suite that catches Cloudflare Error 1101 ran
against a preview Worker with different bindings and a different `NEXT_PUBLIC_SITE_URL`. `smoke` needs
`deploy-production`, is gated on `github.event_name == 'push'`, and runs Playwright with `BASE_URL` taken from the
**`NEXT_PUBLIC_SITE_URL` repository variable**, the same name the app declares in `environment.d.ts` and the same
value `_deploy-web.yml` hands the Worker as `--var NEXT_PUBLIC_SITE_URL`, so the address is written once. It has to
be a **repository** variable rather than one on `web-production`: this job declares no `environment:` and a caller
job cannot declare one either, so both would read an empty string. A first step fails the job when it is empty,
because [`apps/web/playwright.config.ts`](./apps/web/playwright.config.ts) falls back to localhost when `BASE_URL`
is unset, and a smoke run against nothing that reports green is worse than no smoke run at all. It sends no
Cloudflare Access headers, which
[`apps/web/playwright.config.ts`](./apps/web/playwright.config.ts) handles by sending none when neither
variable is set. It declares no `environment:` on purpose: production is public, so the job needs no secret,
and naming an environment would hand it ones it has no use for.

**The step calls `pnpm exec playwright test`, not `pnpm run test:e2e -- <flags>`, and the difference is not
style.** Playwright's parser treats `--` as end-of-options and turns everything after it into positional file
filters, so `pnpm run test:e2e -- --grep "@smoke"` runs the *whole* suite with the grep silently discarded;
verified by listing. The two scripts in [`apps/web/package.json`](./apps/web/package.json) that used to be
written that way, `test:e2e:ui` and `test:e2e:changed`, are not: both invoke `playwright test` with their flag
directly. This paragraph said they still had the defect long after they stopped.

**The `@smoke` cases all live in [`apps/web/e2e/smoke.spec.ts`](./apps/web/e2e/smoke.spec.ts), and the step
passes no `--pass-with-no-tests`, which is the point.** Playwright exits 1 on an empty set, so the flag would
make a typo in the grep green; without it, a grep that stops matching fails the job, which is the only thing
that keeps the set honest. They are the homepage with a non-empty title, the 404 route — `/_not-found` is the
only page rendered per request, so it is the one that shows Cloudflare Error 1101 — and `robots.txt`.

**That trio is the same in every repository that deploys**, in biancafiore, in contribKit and in the docs site
below, so a set that differs between them is drift rather than a decision. contribKit carries a fourth that
earns its place, `/user/<name>.svg`, because that route cannot be prerendered and is the only thing there that
distinguishes a running Worker from a bucket of assets; here the 404 route already plays that part.

**They live in one file because this set can revert a deploy**, and the first run proved why that matters.
On 2026-08-29 the merge of the Next 16.3.3 upgrade deployed cleanly and the 404 case passed, confirming the
fault this repository had been carrying since 16.3.1 was gone. Then `/sitemap.xml` and `/api/health`
answered **403** to the runner across all three retries, `smoke` failed, and `rollback` returned production
to the broken version. A good deploy was reverted by cases that were never about the Worker.

**So `/sitemap.xml` and `/api/health` are out of the set, and the rule is now explicit: a case whose result
depends on the caller's address cannot hold the power to revert a release.** Both sibling repositories lost
a case to the same shape — biancafiore's `/rss.xml` and `/sitemap-index.xml`, contribKit's `/api/health` —
and in every instance a browser gets the expected response while a datacenter address does not, which points
at a zone rule rather than at anything in the tree. Cloudflare's **Security Events** log names the rule; the
fix is a Cloudflare setting. The cases themselves are not deleted: they stay in `sitemap.spec.ts` and
`api/health.spec.ts`, where the preview run exercises them against a `workers.dev` host the rule does not
match.

**One of them could not have failed anyway, which is worth knowing before trusting a similar assertion.**
`names the host under test in every entry` loops over the sitemap's `<loc>` entries and asserts each starts
with the origin. On a 403 there are no entries, the loop body never runs, and the test passes: it reported
green in the very run where the sitemap was unreachable. It now asserts the list is non-empty first.

**`smoke` gates `release-web`, now that it has tests to gate with.** The rule this repository already runs on
is that a tag means the version is live: `release-web` needs `deploy-production`, and it needs `smoke` as
well, so a tag means the version is live *and answering*. It was left ungated while the grep matched nothing,
because a job that cannot fail is not a gate; that condition no longer holds. `smoke` needs no Cloudflare
credentials and declares no environment.

**A failed `smoke` run rolls production back.** Holding the tag leaves a version that does not answer serving
traffic, so `rollback` runs `wrangler rollback --env production --yes` from `apps/web` when `deploy-production`
succeeded and `smoke` failed, returning the Worker to the version that was live before the push. It is a separate
job, with `environment: web-production`, because it needs the Cloudflare credentials that `smoke` deliberately does
without, which also means it is the one part of this that waits on the four-environments secret work. The cost is
worth stating: a smoke case that fails for a reason outside the Worker now reverts a good deploy, so a case whose
result depends on the caller's address does not belong in this set. Both sibling repositories have lost one to
exactly that.

**The docs site has the same pair, and it needed a Playwright config that can leave localhost.**
`docs.yml`'s `smoke` job runs the three `@smoke` cases in [`apps/docs/e2e/smoke.spec.ts`](./apps/docs/e2e/smoke.spec.ts)
against the **`DOCS_SITE_URL` repository variable**, guarded the same way, after the deploy; `release-docs` needs it
so a `docs-v*` tag means the site is answering, and `rollback` reverts the Worker when the deploy succeeded and any of them failed. The site is static assets, so the trio is the whole of what a deploy can get wrong there. [`apps/docs/playwright.config.ts`](./apps/docs/playwright.config.ts)
took `BASE_URL` for this: it hardcoded `http://localhost:4321`, always started a `webServer`, and threw at import
time when `apps/docs/dist` was missing, which is right for the suite the `build` job runs against a local preview
and impossible for one that talks to a deployed site. With `BASE_URL` set it skips the `dist` guard and the
`webServer` both.

**`cross-package-notice` is advisory, not a gate.** A pull request touching both packages lands in both
changelogs, because attribution is by path and `main` takes squash merges. Sometimes that is what you
want, so the job posts a sticky comment saying what will happen and does not fail the run.

**`deploy-tail` passes the BetterStack host as well as the token, and `workers/tail/wrangler.toml` no longer
hardcodes it.** The host lived in that file's `[vars]` while the app read
`vars.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` in `_deploy-web.yml`, so reissuing the BetterStack source
moved the app and left the tail Worker posting into a dead endpoint, silently. Both values now come from the
same two GitHub variables. The details, and the response check that stops the failure being silent, are in
[`apps/web/CLAUDE.md`](./apps/web/CLAUDE.md).

**`cleanup-development.yml` queues each of its jobs behind the workflow that deployed the Worker that job deletes, which is what stops it deleting a Worker
that is still under test.** It fires on `pull_request: closed`, and closing a pull request does not cancel
the run already going: `e2e` needs `deploy-development` and drives the per-PR Worker over the network, so
the delete raced it and turned every remaining spec into a "There is nothing here yet" placeholder: one run
on #343 reported 47 failures with nothing wrong in the code. Renovate is how it happens, because it
auto-merges on the required checks and `e2e` is not one of them.

The fix is a queue, not a wait loop: `cleanup-web` declares `group: CI-refs/pull/${{ github.event.pull_request.number }}/merge` with
`cancel-in-progress: false`. `ci.yml`'s group is `${{ github.workflow }}-${{ github.ref }}`, which on that pull request's run is exactly `CI-refs/pull/<number>/merge`, so the two
strings match and GitHub holds the job pending until the CI run completes. A pending run occupies no
runner, so this costs nothing. **The group is spelled from the number and not from `github.ref`, and the difference is the whole fix.** It said `CI-${{ github.ref }}` first, on the assumption that a closed event carries the same merge ref as an open one. On a merged pull request it does not: `github.ref` resolves to `refs/heads/main`, so the cleanup joined the group of the *push* to `main`, ran while the E2E was still driving the Worker, and, because a group holds one pending run and the newer replaces the older, was cancelled whenever two merges came close together; eight cleanups were cancelled in one week and left their Workers alive. **The coupling is still by workflow *name***: renaming `ci.yml`'s `name: CI`
silently unqueues the cleanup and the race comes back, which is why `tests/docs-consistency.test.ts`
substitutes each deploying workflow's own `name:` into its group expression, replaces its `github.ref` with the pull request's merge ref, and compares the result with the
literal the matching cleanup job hardcodes. A third job, `sweep`, runs weekly and on dispatch: it lists the account's Workers through the Cloudflare API, keeps every `pr-<n>-forever-pto-development` and `pr-<n>-forever-pto-docs-development` whose pull request is still open, and deletes the rest, so a cleanup lost to a token or an outage does not leave a Worker behind for good.

**The group is per job, and it used to be per workflow, which queued `cleanup-docs` behind the wrong thing.**
A workflow-level `concurrency` covers every job in the run, so one group meant both deletes waited on `CI`.
But the Worker `cleanup-docs` deletes is deployed by the `preview` job in `docs.yml`, whose group is
`docs-${{ github.ref }}`, and nothing in `ci.yml` touches it: the docs preview could be deleted while its own
workflow was still using it, and `ci.yml` finishing was not evidence that it had stopped. `cleanup-web` keeps
`CI-…` and `cleanup-docs` takes `docs-…`, each on its own job and each spelled from the pull request number. This is also why the paragraph above no longer
says `cleanup-docs` rides along harmlessly: it did not, it rode along behind an unrelated run.

**`docs-refresh` exists because the release commit carries `[skip ci]`.** The docs site renders the app
version from `apps/web/package.json`; without a dispatch after a web release, the published site keeps
advertising the previous one.

Husky runs `lint-staged` on `pre-commit`, `commitlint` on `commit-msg` and `verify` on `pre-push`, the same
command the CI `Verify` job runs, so a green push is a green check.

**`typecheck` ends with `astro check`, and that tail is what puts the cross-package seam in front of
the author.** (Do not "fix" that command by pointing it at `tsc`: a raw `tsc --noEmit -p apps/docs` reports
four errors `astro check` correctly does not, all artefacts of Astro's JSX namespace being applied to the
app's React components: `keyof HTMLElements` against `keyof HTMLElementTagNameMap`, and motion's
`DOMMotionProps`. `astro check` does catch a real prop break, verified by deleting a required `label` from
`SliderDemo` and watching it fail.) The docs site typechecks the 32 demo components against `apps/web`'s real props (a renamed
`Button` variant fails there because `ButtonDemo`'s `Record<ButtonVariant, string>` is exhaustive), but the
check used to run only inside `docs.yml`'s `build` job. So an app PR that broke the docs passed `pre-push`,
passed the `CI` workflow, and failed in a workflow called **Docs** that does not read as blocking. Whether it
*was* blocking depended on branch protection, and this repo has already been bitten once by the required
checks not including the one that mattered.

**What that tail does *not* cover is a `@ui/…` specifier pointing at nothing.** Moving a component between folders under [`apps/web/src/ui/`](./apps/web/src/ui) left a demo importing the old path; `astro check` reported zero errors and only `astro build` failed, in the Docs workflow, after the app's CI had gone green. `tests/docs-consistency.test.ts` resolves every one of those specifiers now.

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
it has no bindings and no secrets, so its deploy passes no `--secrets-file` and no `--var`
override, and it ships the `docs-dist` artifact the `build` job already produced rather than building a
second time.

## Maintenance contract

These documents are not generated. A change that does not update them leaves the tree describing code that
no longer exists, so when you change code, update the docs **in the same commit**: a follow-up commit is a
promise, not a fix.

| Document | Answers | Update it when |
| --- | --- | --- |
| [`CONTEXT.md`](./CONTEXT.md) (root only) | *What does this word mean?* A domain glossary, and nothing else: no file names, no libraries, no implementation detail | A domain term changes meaning, a new one appears, or a second name for an existing concept shows up in the code or the UI |
| This file | *How is the repository put together?* Layout, shared tooling, releases, CI | You change the workspace, the release setup, a workflow, or a rule that spans both packages |
| `apps/*/README.md` | *What is this package, and how do I run it?* The human-facing front page for one package |
| `apps/*/CLAUDE.md` | *What may I change here, and what are its rules?* The agent-facing guide | You change a package's stack, commands, deployment or its own conventions. Both files, and they answer different questions |
| `apps/web/src/**/CLAUDE.md` | *What may I touch here, and how is this folder built?* Layer contract at a layer root; files, public API, invariants and gotchas below it. Its `# ` heading is the folder's own path, repo-relative: `# apps/web/src/domain/calendar`, never `# domain/calendar` | You change a layer's dependencies, a signature, an invariant, or the files in that folder |
| [`adr/`](./adr/) | *Why is it like this?* One decision per file | You make a decision that is hard to reverse, surprising without context, **and** the result of a real trade-off. If any of the three is missing, skip the ADR |
| [`README.md`](./README.md) | *What is this product and how do I run it?* The human-facing front page | The product's capabilities, the stack table, the scripts or the required versions change |

| If you change | Update |
| --- | --- |
| What a domain word means, or introduce a new one | [`CONTEXT.md`](./CONTEXT.md): the glossary, vocabulary only |
| A folder's layout, the files a concept is made of, or a rule its guide states | that folder's nested `CLAUDE.md` |
| A behaviour a doc states as an invariant or a gotcha | that bullet, or delete it if it stopped being true |
| A layer's allowed imports | that layer's `CLAUDE.md`, and the ADR that decided the boundary |
| A package script, a path alias, or the folder tree | the *Commands* section here or in the package guide, and `README.md` if it lists the script |
| A translation key | all six bundles under [`apps/web/src/ui/i18n/messages/`](./apps/web/src/ui/i18n/messages); parity is asserted |
| A decision an ADR records | that ADR: amend it, or supersede it and say so in both `## Status` blocks |

[`tests/docs-consistency.test.ts`](./tests/docs-consistency.test.ts) makes the mechanical half of that
contract executable. It runs with `pnpm test:ut` (so, in CI on every PR) and asserts: that `CONTEXT.md`
exists only at the root, is linked from here, and stays a glossary: no backticked token holding a path, a
call signature or a source-file name, every term defined, no empty `_Avoid_` list, no term listing itself as
its own alternative; that the workspace globs resolve, both packages are members with their own manifests,
the root stays private and dependency-free at `0.0.0`, neither package carries its own Biome config or
lockfile, and every literal path Biome's `files.includes` excludes still resolves; that every layer root has a `CLAUDE.md`, that both package guides exist and are listed here, and
that every guide under [`apps/web/src`](./apps/web/src) is listed in the web package's own table; that ADRs are named
`NNNN-slug.md`, numbered contiguously from `0001`, carry the template's sections, and are each linked from
some document **outside** `adr/` (an ADR nothing points at will not be read), and that an ADR names back
every document which ties the word *amend* to it, because twice in one audit a nested guide recorded a
change and the ADR it amends did not (the guide was right and the ADR was wrong, which is the worse
direction, since the ADR is what the next agent is told not to re-litigate); that every relative markdown
link resolves **and points at what it names**, the second half being a table row that names one package and
then links the root twin of a file that package has its own copy of, which is how ADR 0011's release row
came to cite the root manifest in the app's row while a resolver passed it; every `.ts`/`.tsx` file named in backticks still exists, no document cites a nested
`CONTEXT.md`, and every symbol the published wiki's `tsx` fences import from `@ui/…` is still exported by the
module they name; that last one is the largest slice of the cross-package seam and had nothing checking it,
because `astro check` registers no MDX plugin and the citation rules match paths rather than symbols; that
every script this file
documents exists in the root manifest, every script the web guide documents exists in one of the two, every
`pnpm --filter <pkg> <script>` citation resolves against the manifest of the package it names, and every bare
script a workflow runs exists in one of the three manifests. One parser reads all four spellings of the package
flag (`--filter`, `-F`, `--dir`, `-C`, with the value attached by a space or an `=`), because a short-flag call with
a mistyped script name used to be invisible to both rules at once: the bare pattern met a `-` where it wanted a
letter and yielded nothing, the filtered one wanted the literal `--filter`, and `docs.yml`, whose own historical
`check` citation against a docs manifest that has never had that script is why the rule exists, reached it citing
nothing and asserted `[]` against `[]`. Each workflow's `pnpm` calls are counted against the ones the parser read, so the next spelling
nobody anticipated fails loudly instead of emptying the list; that every backticked constant the published
wiki names **in prose** exists somewhere in `apps/web`, fenced blocks excluded, since a fence is the app's own
code quoted verbatim; that the `@ui` seam target is declared once, in
[`apps/docs/tsconfig.json`](./apps/docs/tsconfig.json), with the vite alias deriving from it rather than
restating it; that every relative `@import` and `@source` in any `.css` the docs package tracks, and in any `<style>` block of
an `.astro` file under it, resolves to a path that exists, which nothing did before: `astro check` does not read CSS,
a renamed `@import` target fails only
`astro build` and a renamed `@source` target fails nothing at all, leaving the demos unstyled on a green build.
The scope was [`apps/docs/src/styles`](./apps/docs/src/styles), which is one file, and a component's scoped
`<style>` is CSS the same rule has to reach; that
every font variable [`apps/web/src/app/fonts.ts`](./apps/web/src/app/fonts.ts) registers is declared in the docs
stylesheet's `:root`, since the app's role tokens point at those names and there is no Next in the wiki to inject them;
that every design token the wiki's swatches name is still declared, counting the bare strings in a `tokens={[…]}` array
and the docs' own visualiser components rather than only `var(--x)` in prose, with a floor on both sides so an emptied
citation set cannot pass it vacuously. `.astro` components count too, with the `--sl-*` vendor prefix carved out rather
than the extension: excluding `.astro` wholesale to keep Starlight's own tokens quiet also hid every token in one that
is ours, and a typo renders transparent, which reads as a pale colour rather than an error; that no locale override under
[`apps/docs/src/content/i18n`](./apps/docs/src/content/i18n) restates the Starlight bundle it overrides byte for byte,
and separately that `search.ctrlKey`, if it is overridden at all, is a modifier on its own: the byte-for-byte rule is
named for that key and cannot see it, because the defect was `Ctrl K` against a vendor `Ctrl` and those are not equal.
Starlight renders the value in a `<kbd>` of its own beside a literal `<kbd>K</kbd>`, and the suite reads that markup
first so the rule fails loudly if upstream stops appending the K;
that the wiki's prose uses the canonical name rather than a retired one, with a compound allowed to pluralise on
**either** word: `day off` plus an optional trailing `s` matches `day offs`, which nobody writes, and missed
`days off`, which the wiki wrote seven times across four pages while the rule reported nothing;
that [`apps/web/tsconfig.json`](./apps/web/tsconfig.json) keeps the two settings `next build` would otherwise fill in for it (`strict`
on and `allowJs` off), that it sits beside the [`next.config.ts`](./apps/web/next.config.ts) that rewrites it, and that
`cloudflare-env.d.ts` stays both excluded from the program and ignored by git, and that
[`apps/web/environment.d.ts`](./apps/web/environment.d.ts) references no identifier it does not import:
`skipLibCheck` is on and that file is a `.d.ts`, so `pnpm typecheck` reads no name inside it; that every
`'use client'`, `'use server'` and `'use cache'` under either package's `src/` is a bare string literal in
first position; that `PUBLIC_ENV` in [`apps/web/next.config.ts`](./apps/web/next.config.ts), imported rather
than regexed out of the source, classifies exactly the `NEXT_PUBLIC_*` names
[`apps/web/environment.d.ts`](./apps/web/environment.d.ts) declares, in both directions, and that each one is
wired where it is actually read: one carrying a zod schema in the build step's `env:`, one carrying the
`RUNTIME_ONLY` sentinel in `wrangler.toml`'s `[vars]`, since those two are read off `CloudflareEnv` and
never reach the client bundle;
that `typescript` is pinned **exactly** in all three manifests, that the root and `apps/web` carry the *same*
pin and that `apps/docs` stays on a `6.` line: three dotted numbers, so a `rangeStrategy` flip to `^7.0.2` in
every manifest at once fails rather than passing as "equal", and a docs package quietly dragged onto 7 fails
too, since that is what breaks `astro check`. The rule asked for one version across all three until
`astro check` made that impossible; that
[`apps/web/next.config.ts`](./apps/web/next.config.ts)'s own `headers()` (imported and awaited, not regexed
out of the source) returns exactly one rule, for `/(.*)`, carrying all nine security headers **with their
values**: a year of HSTS with `includeSubDomains`, `X-Frame-Options` refusing the frame, `nosniff`, and
`frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'self'` in the CSP, the three whose absence is
invisible in a browser, and that the policy names no Google font host, because `next/font/google` downloads
and self-hosts at build time so the two allowances that named them were dead, and the whole policy sits
outside `src/` where the co-located-test convention does not reach it; that every binding `CloudflareEnv` declares is present
in **each** of `wrangler.toml`'s three environments, that each named environment declares every binding
*kind* the top level declares, that `[assets]` and `[placement]` are declared once and `[observability]`
reads identically wherever it is restated, and that the payment rate limiter is identically bounded in all
of them; that no
deploy step, no build step and no `wrangler secret` step in any workflow is wrapped in `nick-fields/retry`, counted rather
than named one file at a time. The secret rule carries **no floor**, unlike the other two: both secret writes are folded into
their deploy as `--secrets-file` now, so the corpus it reads is empty, and a floor of one would fail on exactly the state the
repository is trying to hold. Both censuses count the job rather than one spelling of it: a deploy also arrives as
`cloudflare/wrangler-action`'s `command: deploy` input and as a script name that resolves to one (`apps/docs`'s
`deploy` is `astro build && wrangler deploy`), and a build as `pnpm exec astro build`, `npx next build`, or a
`build` script reached through the short `-F` flag. The deploy census saw two of this repo's four against a floor of two, so half the corpus satisfied
it and the other half was unguarded; that `TAIL_PATHS` matches every relative import reachable **transitively** from
[`apps/web/workers/tail/`](./apps/web/workers/tail/), at least one of which has to land outside that folder, and that
every one of those reaches **resolves**: a specifier the walk cannot place is a failure, not an exemption. It used to
append `.ts` and nothing else, so a directory specifier standing for the `index.ts` inside it, and a NodeNext
`./foo.js`, both produced a path that does not exist, and the assertion then guarded itself with `existsSync`, skipping exactly the reaches it could not follow;
that every workflow file is **linked** from this guide and carries its own `##` section in the wiki, the link rather
than a bare mention, since `ci.yml` is named a dozen times here and one incidental mention used to be enough;
that the cleanup workflow's concurrency
group still equals `ci.yml`'s with its `name:` substituted in and the pull request's merge ref in place of `github.ref`, and that each of `ci.yml` and `docs.yml` aggregates its gated jobs, the preview E2E among them, under a `Check` job;
and that every locale bundle has exactly the keys [`en.json`](./apps/web/src/ui/i18n/messages/en.json) has and shouts nothing outside a named acronym allow-list. Key parity compares key *sets*, so it can see neither a value that drifted nor one written in capitals; the allow-list is itself asserted to hold only names the bundles still use.

It reads staged *and* unstaged files, so a rule fires before the offending file is committed. **Each rule was
verified by breaking it and confirming the matching case fails**; keep that property when you add one.

Four traps that have each cost a rule its teeth, all found by breaking one:

- **A regex anchored on `$` reads nothing in a working-tree file with CRLF.** The index is all LF
  (`.gitattributes` carries `* text=auto eol=lf` and no tracked blob is CRLF), but the *checkout* on Windows
  is not, and the suite reads the working tree. The first version of the workflow-script rule silently
  checked zero lines of `_deploy-web.yml` for exactly this reason. Split on `/
?
/`.
- **Three backticks pair one at a time**, so a rule that scans a wiki page without stripping fenced blocks
  first is off by one after the page's first fence and reads the rest inverted.
- **A compound noun does not pluralise on its last word.** `term + "s?"` reads `day offs` and cannot read
  `days off`. Pluralise every word of the compound, and let the gaps take any run of whitespace so a term
  broken across a wrapped line is still one term.
- **A `run:` key does not see every command a workflow runs.** `nick-fields/retry` takes its script on
  `command:`, and it used to wrap every wrangler and OpenNext call here. Two preview deletes still use it, and
  a rule that reads only `run:` would call the workflows clean while the wrapper it forbids sat one key over. A
failure means the docs and the code disagree; fix whichever is wrong. It cannot check rationale (whether an
explanation is honest), and that part is on you.

Two traps worth naming: deleting a resolved entry from a "known inconsistencies" list is part of the fix, not
tidying to do later; and a `file.ts:123` citation rots the moment anything above it moves; name the symbol
instead.

Propose an ADR when a decision is **hard to reverse**, **surprising without context** and **the result of a
real trade-off**. All three, or it is not an ADR. Copy [ADR 0000](./adr/0000-adr-template.md), number it one
above the highest existing file, and link it from wherever it bites: a gotcha here, a package guide, a
`CONTEXT.md` entry.

`CONTEXT.md` is reserved for the root glossary. **Never create a nested one**: the name would mean two
things, and the `domain-modeling` skill reads it as vocabulary and would rewrite a layer contract as a term
list. `tests/docs-consistency.test.ts` asserts no document *cites* one either: the published wiki taught the
opposite under a heading of "CONTEXT.md per folder" and named five paths that have never existed, which the
relative-link rule could not catch because they were prose rather than links.

## Gotchas

- **Biome's `noConsole` is an error with no allowlist**: no `console` at any level, so a stray `console.log`
  fails the build rather than shipping. Two places call it anyway, and both are the log sink itself, which
  has nothing else to call: the BetterStack client's unconfigured warning, scoped in `biome.json`'s
  `overrides`, and the two ingest-failure reports in `apps/web/workers/tail/index.ts`, which carry a
  `biome-ignore` each rather than a second `overrides` entry. Anything else is a defect.
- **`format:changed` and `lint:changed` pass `--changed`, which means "changed against `main`".** On a
  branch that moves or renames a large number of files that is every one of them, and a `pre-commit` hook
  will happily reformat and stage files the commit was never about.
- **The `v1` floating tag is stale and nothing maintains it.** It diverges between local and remote, which
  makes semantic-release's own `git fetch --tags` fail outright with *would clobber existing tag*. No
  workflow moves it and no ADR records it.
- **Two dependencies are patched, and Renovate must not automerge either.** `pnpm-workspace.yaml` keys
  `boneyard-js` by bare name, with no version, so that patch is applied to whatever version resolves: a bump
  that still applies cleanly but no longer patches what the diff was written against is silent, the install
  succeeds and CI stays green. `vaul` is keyed as `vaul@1.1.2`, so there a bump fails the install loudly
  instead; what the patch does and why is [`src/ui/modules/core/CLAUDE.md`](./apps/web/src/ui/modules/core/CLAUDE.md)'s
  to explain. [`.github/renovate.json`](./.github/renovate.json) carries one rule naming both and turning
  `automerge` off, against the blanket patch/minor automerge above it; a human reads the upstream diff and
  regenerates the patch. `tests/docs-consistency.test.ts` asserts the pairing, so a third patch without its
  Renovate entry fails rather than automerging past the diff nobody read.
- **`minimumReleaseAge` is declared twice and nothing keeps the two in step.** `pnpm-workspace.yaml` says
  4320 minutes (3 days), `.github/renovate.json` says 4 days. Renovate being the stricter of the two is what
  makes it safe: it cannot open a pull request for a release the installer would then refuse. Lower it below
  the workspace's and CI fails on the lockfile rather than at resolution, because the age is re-checked on
  **every** install and not only when a version is picked.
- **An import sorted above a `'use client'` silently deletes it, and only `next build` notices.** Biome's
  import sorting moves an added import to the top of the file; the directive then stops being the first
  statement, and the formatter parenthesises the orphaned string, leaving `('use client');`. That is an
  ordinary expression; the module becomes a Server Component. Typecheck, Biome and the whole unit suite
  stay green, because none of them models the RSC boundary. Six planner files sat like that for several
  commits. `tests/docs-consistency.test.ts` parses for it now, in both shapes.
- **Never run `lint-staged` by hand.** It stashes the whole tree; interrupting it can revert the working
  copy. Let the hook run it.
