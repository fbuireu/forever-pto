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

## Closed on 2026-08-06 — and it was never the blocker it was written up as

**The skeleton registry drift is fixed, by deleting two files.** This entry stood for five days as "cannot
be fixed by editing anything", on the reasoning that `registry.ts` is generated and the CLI needs headless
Chromium over a running app. Both halves were wrong, and the way they were wrong is the lesson.

`registry.ts` is generated, but its body is a pure function of the `.bones.json` files on disk and
`boneyard.config.json` — there was nothing to *capture* in order to remove something. And the two dead
descriptors were in the registry precisely *because* they were on disk: the CLI merges what it captured with
every descriptor it finds (`mergePreservingExisting`, absent `--force`), so a rebuild would have re-registered
them for ever. Deleting `alternatives-manager.bones.json` and `pto-status.bones.json` — 35 bytes each, both
empty — and dropping their two imports and two `registerBones` entries is exactly what the next build emits.

**Reading the library instead of the write-up also turned up a real defect the write-up had inverted.** It
recorded that `express-checkout` "always falls back to its hand-written fixture". It does not, and could not:
`Skeleton` renders `showFallback ? fallback : children`, and `fixture` is build-time only — returned early,
behind `window.__BONEYARD_BUILD`, so the capture has a shape to measure. `premium/CheckoutForm.tsx` passed
`fixture` and no `fallback`, so with no bone registered under that name the express-checkout slot rendered an
**empty container** for the whole time Stripe took to be ready, and `ExpressCheckoutFixture.tsx` was dead code
at runtime. `pages/planner/ManagementBar.tsx` had the same shape, exposed only in the window before its
container is measured. Both now pass `fallback` alongside `fixture`.

For the same reason, capturing `express-checkout` never needed a real Stripe client secret: the CLI renders
the `fixture`, not the real children. It remains uncaptured, which is now cosmetic.
[`src/ui/modules/CLAUDE.md`](../../src/ui/modules/CLAUDE.md) carries the `fixture`-versus-`fallback` rule
where a reader will meet it before writing the next `<Skeleton>`.

## The older record

[`sweep-findings.md`](./sweep-findings.md) is the earlier, 2026-07-26 sweep. It is a dated record on the same
terms as this one: not rewritten as the code moves, so its line numbers have drifted and one of its
prescriptions is explicitly marked as no longer safe to copy.
