# 1. The planner runs entirely in the browser

Date: 2026-07-26

## Status

Accepted. The premise the rest of this set rests on: [ADR 0004](./0004-cloudflare-workers-as-deployment-target.md), [ADR 0007](./0007-persisted-client-state-is-obfuscated-not-encrypted.md) and [ADR 0008](./0008-premium-derived-from-payment.md) all follow from it.

## Context

The product takes a Country, a Region, a year and a PTO budget and returns a Suggestion. Every one of those inputs comes from the user, and the holiday calendar they are matched against ships inside the bundle. There is no input the server could supply better than the browser already has, and no plan worth persisting that the user could not reproduce in a keystroke.

The obvious alternative, computing plans on the server and storing them per user, buys cross-device sync and shareable links, but only after building the identity system needed to key them, and it puts a network round-trip in front of every filter change in a UI whose whole appeal is that the numbers move as you drag a slider.

## Decision

Holiday data, bridge detection, suggestions, alternatives and metrics are all computed client-side. The database holds payment and contact records only; no plan is ever persisted server-side.

This is about persistence, not about traffic. Error logging does send plan-shaped context off the device: the year, the PTO count, the holiday count and the chosen Strategy travel with a failed calculation so it can be diagnosed. Nothing there identifies a person or a date, but "the plan never leaves the browser" would be an overstatement, and no doc should make it.

## Consequences

- No cross-device sync, no shareable plan links, no server-rendered plan for SEO. A plan lives in one browser's local storage and nowhere else.
- Recalculation is instant and free. Changing a filter re-runs the whole pipeline with no network round-trip and no per-request cost.
- There are no user accounts and no users table. Premium is derived from a payment record, not from an identity; see [ADR 0008](./0008-premium-derived-from-payment.md).
- The holiday database is pinned to whatever version of the holiday package is bundled. Correcting a wrong Holiday requires a deploy, not a data edit.
- The server does almost nothing, which is what makes a request-priced runtime the right host. See [ADR 0004](./0004-cloudflare-workers-as-deployment-target.md).
