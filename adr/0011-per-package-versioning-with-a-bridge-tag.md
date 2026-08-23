# 11. Each package versions itself, and a bridge tag carries the app's history across

Date: 2026-08-15

## Status

Accepted.

## Context

One manifest at the repository root meant one version and one release line for two deliverables that ship independently. A documentation dependency bump produced a `fix(deps)` commit, semantic-release saw a `fix`, and the app was released for a change it never saw.

The repository already carried two workarounds for this, and both were configuration whose entire job was to suppress the symptom: a rule in the docs guide requiring documentation pull requests to use the `docs:` commit type — which works only because the repository squash-merges and the pull-request title becomes the commit — and a `semanticCommitType: "docs"` override in [`renovate.json`](../.github/renovate.json) doing the same thing for bots. Neither addressed the cause, and both failed open: a contributor who titled a documentation pull request `fix:` cut an app release, and nothing caught it.

Two alternatives were weighed.

**Changesets** has better ergonomics for exactly this problem: an explicit per-package intent file, written by the author, reviewed in the pull request. It was rejected because adopting it dismantles an invariant this repository paid for. Release currently *follows* deployment — `release-web` needs `deploy-production`, so a version tag means the version is live. That ordering exists because two standalone deploy workflows once raced [`ci.yml`](../.github/workflows/ci.yml) and cut releases for versions that had failed to reach production. Changesets releases on merge, from its own job, with no natural place to hang a deployment gate.

**Leaving one `v*` line for the whole repository** was the zero-work option and preserves the defect verbatim.

## Decision

Each package runs its own semantic-release through `semantic-release-monorepo`, which attributes a commit to a package by the paths it touches.

| Package | `tagFormat` | Writes | Runs in |
| --- | --- | --- | --- |
| `apps/web` | `web-v${version}` | [`package.json`](../package.json), [`CHANGELOG.md`](../apps/web/CHANGELOG.md), a GitHub release | `ci.yml`, after `deploy-production` |
| `apps/docs` | `docs-v${version}` | a tag and a GitHub release only | [`docs.yml`](../.github/workflows/docs.yml), after `deploy` |

`tagFormat` is stated explicitly in both. Left out, `semantic-release-monorepo` derives it from the package name and would produce `forever-pto-v${version}` — and `tagFormat` is used both to *find* the previous release and to write the new one, so the derived form would not match the history.

`apps/docs` deliberately runs **no** changelog, npm or git plugin. It pushes nothing to `main`, which is what stops the two release jobs racing each other for the branch rather than relying on the shared concurrency group alone. Its own version stays `0.0.0` permanently and nothing reads it: the docs site displays the **app's** version, read from [`apps/web/package.json`](../apps/web/package.json) at build time.

A **bridge tag `web-v1.8.2`** is created on the same commit as the existing `v1.8.2`, so the new tag format finds the existing history. The historical plain `v*` tags are left in place, untouched.

The `docs:`-commit-type rule and the `renovate.json` override are removed. Attribution by path replaces both.

## Consequences

- **The bridge tag is load-bearing and looks like debris.** It is an unannotated tag on a commit that already carries `v1.8.2`. Delete it and the next app release is computed as a first release: `web-v1.0.0`, published over a 1.8.x line, written into `apps/web/package.json`, and not recallable from GitHub Releases. The `release-web` job carries a step that fails the build when no `web-v*` tag exists, which turns the silent version of this failure into a loud one.
- **Squash-merge is now load-bearing.** Attribution reads the paths a commit touches, and `git diff-tree` prints nothing for a true merge commit. Enabling merge commits would make every merge release nothing, silently.
- **One package per pull request.** A commit touching both packages appears in both changelogs. This is guidance rather than a gate: `ci.yml`'s `cross-package-notice` job detects the case and posts an advisory comment, but does not block the merge — a change that genuinely spans both packages is legitimate, and this very migration was one.
- **A change confined to the repository root releases nothing** — `.github/`, [`biome.json`](../biome.json), `adr/`, `tests/`, the root manifest. Correct, and occasionally surprising when a CI fix appears in no changelog at all.
- **Two tag vocabularies exist forever**, and `git describe` returns whichever package released most recently. Any tooling that reads a version from `git describe` has to filter by prefix.
- **The docs site can advertise a stale app version.** The release commit that bumps `apps/web/package.json` carries `[skip ci]`, so nothing rebuilds the site. A `docs-refresh` job in `ci.yml` dispatches `docs.yml` after a successful web release to close that window; if it fails, the published version label is wrong until the next documentation change.
- **The plain `v1` floating tag is now visibly unmaintained.** Nothing moves it, no ADR records it, and it diverges between local and remote — which makes semantic-release's own `git fetch --tags` fail outright with *would clobber existing tag*. It is left alone here rather than deleted, but it is not part of this scheme.
- Recorded elsewhere: the Releases section of [`../CLAUDE.md`](../CLAUDE.md). The layout that makes this possible is [ADR 0010](./0010-apps-web-and-apps-docs-monorepo-layout.md).
