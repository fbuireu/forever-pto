# 11. Each package versions itself, and bridge tags carry the app's history across

Date: 2026-08-15

## Status

Accepted. Amended 2026-09-23: each release job fast-forwards onto the head of `main` before releasing, because the `release` group serialised the jobs without moving the checkout, the second one stood down on every cross-package push, and a merge landing mid-run refused the push outright; the *Decision* section carries it. Amended 2026-09-12: `apps/docs` now runs the same plugin chain as `apps/web` and pushes its own
release commit. The clause below that kept the changelog off it read the race backwards, and the *Decision*
section carries the correction; everything else about per-package versioning and the bridge tags stands.

## Context

One manifest at the repository root meant one version and one release line for deliverables that ship independently. A documentation dependency bump produced a `fix(deps)` commit, semantic-release saw a `fix`, and the app was released for a change it never saw.

The repository already carried workarounds for this, and both were configuration whose entire job was to suppress the symptom: a rule in the docs guide requiring documentation pull requests to use the `docs:` commit type, which works only because the repository squash-merges and the pull-request title becomes the commit, and a `semanticCommitType: "docs"` override in [`renovate.json`](../.github/renovate.json) doing the same thing for bots. Neither addressed the cause, and both failed open: a contributor who titled a documentation pull request `fix:` cut an app release, and nothing caught it.

The alternatives were weighed.

**Changesets** has better ergonomics for exactly this problem: an explicit per-package intent file, written by the author, reviewed in the pull request. It was rejected because adopting it dismantles an invariant this repository paid for. Release currently *follows* deployment: `release-web` needs `deploy-production`, so a version tag means the version is live. That ordering exists because standalone deploy workflows once raced [`ci.yml`](../.github/workflows/ci.yml) and cut releases for versions that had failed to reach production. Changesets releases on merge, from its own job, with no natural place to hang a deployment gate.

**Leaving one `v*` line for the whole repository** was the zero-work option and preserves the defect verbatim.

## Decision

Each package runs its own semantic-release through `semantic-release-monorepo`, which attributes a commit to a package by the paths it touches.

| Package | `tagFormat` | Writes | Runs in |
| --- | --- | --- | --- |
| [`apps/web`](../apps/web) | `web-v${version}` | [`apps/web/package.json`](../apps/web/package.json), [`apps/web/CHANGELOG.md`](../apps/web/CHANGELOG.md), a GitHub release | `ci.yml`, after `deploy-production` |
| [`apps/docs`](../apps/docs) | `docs-v${version}` | [`apps/docs/package.json`](../apps/docs/package.json), `apps/docs/CHANGELOG.md`, a GitHub release | [`docs.yml`](../.github/workflows/docs.yml), after `deploy` |

`tagFormat` is stated explicitly in both. Left out, `semantic-release-monorepo` derives it from the package name and would produce `forever-pto-v${version}`, and `tagFormat` is used both to *find* the previous release and to write the new one, so the derived form would not match the history.

**Both packages run the same plugin chain, and that is a correction.** `apps/docs` ran neither changelog, npm nor git plugin, on the stated ground that pushing nothing to `main` is "what stops the release jobs racing each other for the branch rather than relying on the shared concurrency group alone". That reads the race backwards. `release-web` and `release-docs` both declare `concurrency: group: release` with `cancel-in-progress: false`, GitHub serialises a group across workflows, so the second one starts after the first one's push rather than competing with it. The group is not a weaker guard the missing plugins were shoring up; it is the guard, and the missing plugins bought nothing on top of it. What the group does not do is move a checkout: `actions/checkout` pins the run's sha, so the second job held the branch one release commit behind the remote and semantic-release stood down, green, on every push that touched both packages. Amended 2026-09-23: both release jobs fast-forward onto `origin/main` before releasing, whatever landed since, so the sibling's release commit and any merge that arrived mid-run join the release instead of refusing its push. A tag can therefore precede the deploy of the commits it absorbed by the minutes their queued run takes, which is accepted: a release lost to a race cost more than a tag a few minutes early.

What they cost was visible for eight tags: `docs-v1.2.3` existed while [`apps/docs/package.json`](../apps/docs/package.json) said `0.0.0`, and the notes for every one of those releases lived on a GitHub release and nowhere a reader of the tree would look. The version being unread is what made the discrepancy survivable, not what made it right: `src/lib/app-version.ts` reads the **app's** manifest for the version the site displays, and the wiki's own Better Stack tag calls `betterstack("init")` with no `release` at all, so nothing anywhere consumed the `0.0.0`.

[`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) asserts what actually holds the line: that every release job which pushes names the `release` concurrency group, and that every package cutting a release carries changelog, npm and git. Taking the group off either job fails the suite, which is the assertion the old clause should have been.

**Bridge tags** are created in the new format on the same commits as the existing plain `v*` tags of the same numbers, so the new format finds the existing history. They are on the remote, and the repository guide lists which they are. The historical plain `v*` tags are left in place, untouched.

At the time of writing, `web-v1.8.3` was the one that mattered, because semantic-release finds the last release by `tagFormat` and therefore reads the **highest** matching tag at whatever point a release runs; which tag that is moves on with every release, and the current one is not tracked here; see [`../AGENTS.md`](../AGENTS.md)'s Releases section for the standing rules a bridge tag has to follow. `web-v1.8.3` carried its own annotation, so `git show web-v1.8.3` answered the question with no guide open; `web-v1.8.2` came first and carried none, which is the entire reason it read as debris. **Annotate every bridge tag with its own reason.**

`web-v1.8.3`'s number matches what is live and its content deliberately does not: the 1.8.3 changelog entry lists one fix, the Renovate bump of Next to 16.3.1, and that bump is rejected here by [ADR 0009](./0009-next-16-2-pinned-by-the-cloudflare-adapter.md). The tag exists so the next release continues from 1.8.3 rather than re-cutting it and writing a second 1.8.3 section into a changelog that already has one.

The `docs:`-commit-type rule and the `renovate.json` override are removed. Attribution by path replaces both.

## Consequences

- **Every bridge tag is load-bearing, and the harmless-looking one is not the one to delete.** `git tag -l 'web-v*'` lists them, and each sits on a commit that already carries the plain `v*` tag of the same number, so they read as duplicates. The one that governs the next release is whichever is currently **highest**, not necessarily the oldest or the most-annotated one: delete it and semantic-release computes a first release, publishing `web-v1.0.0` over the existing line, writing it into `apps/web/package.json`, and GitHub Releases cannot recall it. `web-v1.8.2` was the one that genuinely looked like debris at the time of writing, because it carried no annotation, and it was also the one whose removal cost nothing while a higher annotated tag stood. Reading "the bridge tag" as singular is how a tidy-up deletes the wrong one. The `release-web` job carries a step that fails the build when **no** `web-v*` tag exists, which turns the total-loss version of this failure into a loud one, but it cannot see the case where the higher tag is gone and a lower one remains.
- **An unannotated bridge tag costs the next reader a guess, so annotate every new one.** `web-v1.8.3` carries its reason in its own annotation and `web-v1.8.2` does not, which is why this ADR and [`../AGENTS.md`](../AGENTS.md) both have to spend a paragraph on a tag that could have explained itself.
- **Squash-merge is now load-bearing.** Attribution reads the paths a commit touches, and `git diff-tree` prints nothing for a true merge commit. Enabling merge commits would make every merge release nothing, silently.
- **One package per pull request.** A commit touching both packages appears in both changelogs. This is guidance rather than a gate: `ci.yml`'s `cross-package-notice` job detects the case and posts an advisory comment, but does not block the merge, because a change that genuinely spans both packages is legitimate, and this very migration was one.
- **A change confined to the repository root releases nothing**: not `.github/`, [`biome.json`](../biome.json), `adr/`, `tests/` or the root manifest. Correct, and occasionally surprising when a CI fix appears in no changelog at all.
- **Rival tag vocabularies exist forever**, and `git describe` returns whichever package released most recently. Any tooling that reads a version from `git describe` has to filter by prefix.
- **A commit landing on `main` while a release job runs loses that release.** `@semantic-release/git` pushes the release commit as `HEAD:main` from the sha the job checked out, so a squash merge in the few minutes between the deploy going green and the push makes it a non-fast-forward: the job fails, no tag is written, and a re-run stands down because the branch it holds is behind the remote. The `release` concurrency group orders the two release jobs against each other and nothing else; it cannot order a merge. Each release job therefore fast-forwards onto the head of `main` before releasing, so such a merge joins the release in flight. The cases that still stand a job down, `main` rewritten under the run or a merge in the seconds between the fast-forward and the push, write no tag, so the run the newer head queued cuts the release over everything since the last one; no filler commit and no dispatch is needed.
- **The docs site can advertise a stale app version.** The release commit that bumps `apps/web/package.json` carries `[skip ci]`, so nothing rebuilds the site. A `docs-refresh` job in `ci.yml` dispatches `docs.yml` after a successful web release to close that window; if it fails, the published version label is wrong until the next documentation change.
- **The plain `v1` floating tag is now visibly unmaintained.** Nothing moves it, no ADR records it, and it diverges between local and remote, which makes semantic-release's own `git fetch --tags` fail outright with *would clobber existing tag*. It is left alone here rather than deleted, but it is not part of this scheme.
- Recorded elsewhere: the Releases section of [`../AGENTS.md`](../AGENTS.md). The layout that makes this possible is [ADR 0010](./0010-apps-web-and-apps-docs-monorepo-layout.md).
