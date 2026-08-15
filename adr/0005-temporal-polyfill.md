# 5. The Temporal polyfill is deliberate, not legacy

Date: 2026-07-26

## Status

Accepted. A consequence of [ADR 0004](./0004-cloudflare-workers-as-deployment-target.md).

## Context

The calendar engine is written against `Temporal`. It has to evaluate in three places: the browser main thread, the Web Worker the planner offloads to, and the server. `Temporal` did not resolve in the deployed Cloudflare Workers runtime, and the failure surfaced only after deploy — a local run and a preview build both looked fine.

An explicit polyfill import looks exactly like scaffolding left behind after native support landed, which is precisely why it needs recording: the next reader to tidy it away will not be able to tell the difference, and the test suite will not stop them.

## Decision

The calendar engine imports `Temporal` from `temporal-polyfill` rather than relying on the global. The explicit import is what makes the same engine code run in the browser, in the Web Worker and on the server.

## Consequences

- Do not replace the import with the global, and do not let a codemod do it either. Nothing in the type system or the unit suite catches the substitution; it fails at runtime, in production only.
- The polyfill's bundle cost is paid by every client, including the ones whose engine supports `Temporal` natively.
