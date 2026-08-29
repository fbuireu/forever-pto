# 5. The Temporal polyfill is deliberate, not legacy

Date: 2026-07-26

## Status

Accepted. A consequence of [ADR 0004](./0004-cloudflare-workers-as-deployment-target.md).

## Context

The calendar engine is written against `Temporal`. It has to evaluate in three places: the browser main thread, the Web Worker the planner offloads to, and the server. `Temporal` did not resolve in the deployed Cloudflare Workers runtime, and the failure surfaced only after deploy: a local run and a preview build both looked fine.

**This is a platform absence, not a runtime one, and the distinction is what stops the wrong fix.** A missing global in workerd normally means a compatibility flag is off, so the first instinct is to reach for `compatibility_flags` or a later `compatibility_date`. There is no flag to reach for: `Temporal` appears in no compatibility flag the installed wrangler knows about, so no compatibility date turns it on, and no future date will until Cloudflare ships the API in the first place. Checked 2026-08-24 against wrangler 4.121.0 and workerd 1.20260804.1, which carry the flag list between them: zero matches.


An explicit polyfill import looks exactly like scaffolding left behind after native support landed, which is precisely why it needs recording: the next reader to tidy it away will not be able to tell the difference, and the test suite will not stop them.

## Decision

The calendar engine imports `Temporal` from `temporal-polyfill` rather than relying on the global. The explicit import is what makes the same engine code run in the browser, in the Web Worker and on the server.

## Consequences

- Do not replace the import with the global, and do not let a codemod do it either. Nothing in the type system or the unit suite catches the substitution; it fails at runtime, in production only.
- **The blast radius is wider than the calendar engine.** Five modules import `temporal-polyfill` directly: [`application/shared/utils/dates.ts`](../apps/web/src/application/shared/utils/dates.ts), [`application/shared/utils/dateIntake.ts`](../apps/web/src/application/shared/utils/dateIntake.ts), [`domain/calendar/utils/helpers.ts`](../apps/web/src/domain/calendar/utils/helpers.ts), [`ui/utils/cookie.ts`](../apps/web/src/ui/utils/cookie.ts) and [`ui/modules/pages/planner/summary/YearTimelineChart.tsx`](../apps/web/src/ui/modules/pages/planner/summary/YearTimelineChart.tsx). A codemod rewriting "the polyfill import" touches all five, two of which are nowhere near the planner, so a review that checks the calendar domain and stops has checked three fifths of the change.
- The polyfill's bundle cost is paid by every client, including the ones whose engine supports `Temporal` natively.
