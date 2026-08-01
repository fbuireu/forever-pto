# Guide sweep — 2026-07-31

Writing the twenty-one nested `CLAUDE.md` guides turned into a defect hunt. Twelve agents read every file in
the folder they were documenting and reported what the code actually did rather than what it was supposed to
do; sixty-six findings came back. Thirteen were documentation drift and were fixed in the same pass. The
other fifty-three were real code defects, and this file was the list of them.

**They are fixed.** What follows is the record of what changed and, at the end, the one thing that is still
open. The detail is deliberately not reproduced here: every invariant worth keeping now lives in the guide
for the folder it belongs to, which is the point of the whole exercise — a finding in a plan document is read
once, an invariant in a folder guide is read before the folder is touched, and
[`docs/docs-consistency.test.ts`](../docs-consistency.test.ts) checks the second against the code.

## What the sweep was actually about

Three themes ran through the fifty-three, and they are worth naming because they are the shapes to watch for
here rather than a list of one-off slips.

**The same computation existed twice and the copies had drifted.** The planning pipeline runs on the main
thread and in a Web Worker, and the two had silently diverged on pseudo-Holidays, the budget clamp and the
auto-suggest cap, so the same Planning Window produced different plans depending on which path ran. The two
are now held in step by mirrored test blocks, and
[`src/application/stores/CLAUDE.md`](../../src/application/stores/CLAUDE.md) states the parity as a maintained
property rather than a coincidence.

**Something was carrying a meaning it was never given.** Removed Days were fed to the engine inside the
holidays array, so a day the user said they would work counted as a Free Day when a neighbouring Bridge was
expanded and scored. The engine now takes an explicit `excludedDays` parameter that reaches the Workday list
and nothing else. In the same family: `generateMetrics` inferred the planning year from the earliest placed
PTO Day, so a plan starting in the Carry-over Months was measured against the wrong year.

**Failures that could never succeed were being retried, and failures that mattered were being swallowed.** A
succeeded Donation carrying no email persisted an empty string as the payments row's key — which
[ADR 0008](../adr/0008-premium-derived-from-payment.md) makes the only key Premium can ever be recovered by,
so the payer was orphaned silently. A missing webhook secret answered 500, asking Stripe to redeliver
forever. A malformed request body rejected outside the Effect program, escaping every `catchTags` map and
becoming a bare 500 with no code. All three are now the other way round.

Alongside those: the public health endpoint stopped enumerating which secrets are configured, the Stripe
processing fee is actually read instead of writing NULL to every payment row, the payment repository maps its
rows instead of returning raw snake_case typed as something else, per-visitor geolocation stopped being
served from a shared cache, and observances stopped counting as Holidays and inflating Effective Days.

## Still open

**The skeleton registry has drifted from what the components ask for.**
`src/ui/modules/bones/alternatives-manager.bones.json` and `pto-status.bones.json` are registered but no
`<Skeleton>` requests them — both are 35-byte empty descriptors, so the shipped cost is two registry entries
rather than two real skeletons. Conversely `express-checkout` *is* requested, by `premium/CheckoutForm.tsx`,
but was never captured, so that Skeleton always falls back to its hand-written fixture.

This one cannot be fixed by editing anything: `registry.ts` is generated, and `boneyard.config.json` has no
list of bone names — the CLI drives headless Chromium over the running app and captures whatever `<Skeleton>`
it finds rendered. Closing it means deleting the two stale descriptors and re-running `pnpm bones:build`, and
for `express-checkout` reaching a state where the checkout form is mounted behind a real Stripe client
secret. Worth deciding first whether that last one is wanted at all: the `<Skeleton>` in question wraps an
empty `div`, so a capture would yield nothing and the fixture is the only meaningful placeholder — dropping
its `name` and leaving it fixture-only is a legitimate answer.
[`src/ui/modules/CLAUDE.md`](../../src/ui/modules/CLAUDE.md) carries the same warning where a reader will meet
it.

## The older record

[`sweep-findings.md`](./sweep-findings.md) is the earlier, 2026-07-26 sweep. It is a dated record on the same
terms as this one: not rewritten as the code moves, so its line numbers have drifted and one of its
prescriptions is explicitly marked as no longer safe to copy.
