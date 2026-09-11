# 17. Logs and traces leave the platform, not the application

Date: 2026-09-11

## Status

Accepted. Supersedes [ADR 0016](./0016-traces-reach-betterstack-by-wrapping-the-opennext-entrypoint.md).

## Context

[ADR 0016](./0016-traces-reach-betterstack-by-wrapping-the-opennext-entrypoint.md) opened with a premise that
has since stopped being true: *"`wrangler.toml` enables `[observability.traces]`, which Cloudflare renders in
its own dashboard and exports nowhere: there is no destination setting."* There is one now. The installed
wrangler's own `config-schema.json` carries it, which is where this was checked rather than in a changelog:
`Observability` declares `redact_query_string`, and both `logs` and `traces` declare `destinations`, an array
of names pointing at an OTLP endpoint and its headers configured in the Cloudflare dashboard, plus `persist`
for whether the same events also land in Cloudflare's own store.

So the mechanisms this repository built to get telemetry off the platform, a tail consumer Worker for logs and
an OpenTelemetry wrapper around the OpenNext entrypoint for spans, are both re-implementations of something
the platform now does. What was left to decide is whether either still earns its place, and the answer differs
between them.

**The tail Worker is straightforwardly redundant.** It flattened `logs` and `exceptions` out of each tail
event and stamped `{ service, script, outcome, url, method, status }` on them. The native export carries all
of that except the constant `service`, redacts the query string through `redact_query_string` rather than
through this repository's own `stripQuery`, and adds the field the tail Worker structurally could not: the
trace id of the span the line was emitted under, because it never received spans at all.

**The wrapper is the interesting half, because deleting it deletes an Effect integration.** *tracer.ts*
bridges Effect's `Tracer` onto `@opentelemetry/api`, so `Effect.withSpan` in a use case becomes a real span
nested under the request. What was weighed:

- **What the bridge actually produces.** `Effect.withSpan` appears on every use case (`createPayment`,
  `processWebhookEvent`, `sendContactEmail` and the `activateWith` entry points) and nowhere else, with no
  `Effect.annotateCurrentSpan`, no span links and no span kind other than `internal` anywhere in production.
  Of `BridgedSpan`'s surface, only `end` and the error status have a producer outside the tests. The bridge
  buys the use-case span names and a `Cause.pretty` message on failure.
- **Whether the bridge could keep its shape on the native API.** It cannot, and this is the load-bearing
  finding rather than a preference. `Tracer.Span` requires `traceId`, `spanId` and `sampled` on the object
  returned *synchronously* by the `span` hook of `Tracer.make`, and requires `end(endTime, exit)` to take a
  caller-supplied timestamp. The runtime's `Span` exposes `setAttribute`, `end()` and `isTraced`, and
  Cloudflare's own documentation states there is no `spanContext()` yet. `enterSpan` and `startActiveSpan`
  also invert the control flow: a span exists only inside a callback, where Effect needs to construct one and
  end it later. Any one of those alone is fatal.
- **What the wrapper costs beyond its own lines.** `main` points at a wrapper file rather than at what
  OpenNext generates, which needs *open-next.d.ts* to type an import of a file that does not exist on a clean
  checkout, and it pulls in `@microlabs/otel-cf-workers`, `@opentelemetry/api`, `@opentelemetry/core`,
  `@opentelemetry/sdk-trace-base` and `@opentelemetry/context-async-hooks`.

One measurement settled it. `instrumentEnv` in `@microlabs/otel-cf-workers` dispatches on the binding kind and
has branches for service bindings, KV, queues, Durable Objects, version metadata, Analytics Engine and D1. It
has **no R2 branch**, and no rate-limiter branch, which are the only binding kinds this Worker declares. ADR
0016's consequence *"Every outbound `fetch` is a span, Stripe, Turso and the R2 cache included"* was wrong
when it was written: R2 is reached through a binding, not through `fetch`, so the incremental cache produced
no span. The native instrumentation covers binding calls. So the trade is the use-case span names against the
instrumentation of every binding the app declares, and it does not go the wrapper's way.

The alternatives considered and rejected:

- **Keep the wrapper, export natively for logs only.** Keeps *correlation.ts* working, since the only thing in
  the tree that installs an OpenTelemetry context manager is the wrapper. It also keeps the whole dependency
  set and a borrowed `main` to produce spans a second pipeline already produces better.
- **Keep the use-case span names through `ctx.tracing.enterSpan`.** Works, since the runtime auto-ends a span
  when the callback's promise settles, but the span would have to be opened at the route rather than in the
  use case, because Effect cannot hand its tracer to a callback-scoped API. That trades one indirection for
  another to keep a handful of names, and it is re-proposable later without re-doing any of this.
- **Set `persist = false`.** Would avoid Cloudflare's own storage charge, and would also delete the only trace
  view that survives Better Stack being unreachable. ADR 0016 was right about that and it still holds.

## Decision

Logs and traces reach Better Stack through Cloudflare's own OTLP export. `wrangler.toml` names the
destinations per stage, `forever-pto-web-logs-production` and `forever-pto-web-traces-production` against
the live Better Stack source and the `-development` pair against the other one, each configured in the
Cloudflare dashboard with its endpoint and bearer token. `head_sampling_rate` keeps the ratio it already used
and `redact_query_string` is on, both identical in every environment.

`main` is `.open-next/worker.js` again: the Worker entrypoint is what OpenNext generates, with nothing wrapped
around it. *apps/web/worker.ts*, *open-next.d.ts*, the tail consumer Worker under `apps/web/workers/`, the
`deploy-tail` job and `TAIL_PATHS` are gone, as are *tracing.ts*, *tracer.ts* and *correlation.ts* with their
tests, every package listed above and the `overrides` pin in `pnpm-workspace.yaml` that existed to hold one of
them still.

`Effect.withSpan` stays at every call site. It is not wired to anything now, and that is deliberate: the calls
cost nothing, they document the boundary of each use case, and they are what a future bridge would attach to
if Cloudflare ships `spanContext()`. Removing them would be the change to undo.

The rejected alternatives are the ones listed above.

## Consequences

- **The correlation helper had to go in the same change, not later.** `trace.getActiveSpan()` reads
  the global context manager of `@opentelemetry/api`, and `@microlabs/otel-cf-workers` was the only caller of
  `setGlobalContextManager` in the tree. Without the wrapper it returns `undefined` on every call, forever,
  and `traceCorrelation()` would have stamped `{}` on every log line with nothing going red: its own test
  installed an `AsyncLocalStorageContextManager` by hand and would have stayed green. Correlation is not lost.
  The platform stamps the trace id on exported log records itself, which is strictly more than the app could
  do, since the app only ever saw spans it had opened.
- **`stripQuery` keeps a reader, and it is the important one.** `redact_query_string` redacts the *request*
  URL in logs and traces. It does not touch a `url` field a caller puts in a structured log context, which is
  what `BetterStackClient.getFullContext` strips and why `stripQuery` lives in `contract.ts`. The reason that
  rule exists, a `payment_intent_client_secret` arriving on the query string of the activation route, is
  unchanged by any of this.
- **What the tail Worker did and nothing replaces.** The constant `service: 'forever-pto'` field is gone;
  `script` is the discriminator, which is what it already was in practice. And `toLogLevel` no longer folds
  the `log` and `trace` levels of workerd onto `info` on the way out, so a Better Stack query filtering on
  `level` has to account for them. `toLogLevel` stays in `contract.ts` for the app's own side.
- **The deploy no longer hands the Worker a Better Stack credential.** `BETTER_STACK_SOURCE_TOKEN` is out of
  the `--secrets-file` of `_deploy-web.yml` and `BETTER_STACK_INGESTING_URL` is out of its `--var` list,
  because *tracing.ts* was the only reader of either. The `NEXT_PUBLIC_BETTER_STACK_*` variables the build
  inlines are untouched: `BetterStackClient` and the browser tracking snippet still read them.
- **Rotating the Better Stack source is now a dashboard change, not a deploy.** The endpoint and token live on
  the Cloudflare destination. That removes the failure mode ADR 0016 and the tail Worker both had, where one
  value moved and the other did not, and it also means the `workflow_dispatch` of `ci.yml` no longer redeploys
  anything on a Better Stack rotation.
- **The destination names in `wrangler.toml` are settings that must exist before a deploy.** A `destinations`
  entry naming a destination that has not been created in the dashboard is the new version of the failure ADR
  0016 guarded with `DROP_SPANS`. There is no in-tree fallback for it, and nothing in this repository can
  assert it.
- **A destination belongs to the account, not to the Worker, which is why the names carry the repo in them.**
  It is created in the Workers Observability section of the account and referenced from any `wrangler.toml` by
  a bare name, so these sit in one namespace with every other Worker on the account: the docs site, the
  per-pull-request previews, and the sibling repositories. `better-stack-logs` was the first spelling and it
  is the wrong one, because the next repository to want a Better Stack source would find the name taken and
  would have to either share the source or pick a worse name. The shape is
  `<repo>-<package>-<signal>-<stage>`, which is the namespacing the GitHub environments and the release tags
  already use (`web-production`, `docs-production`, `web-v*`), so an alphabetical list of destinations groups
  itself and `apps/docs` has a spelling waiting for it.
- **Each stage exports into its own destinations, and nothing would have failed if it did not.** A
  destination has no environment of its own; what is per-environment is which name each `[observability]`
  block references, so a development Worker naming the production destination is accepted, exports happily,
  and files preview traffic with the live site's, where only the `script` attribute distinguishes it. That is
  the shape the tail consumer Worker had, since it was deployed once and served every app Worker at once, and
  it is not the shape Better Stack is configured for: there is a source per stage. The top level is
  production's twin, sharing its `name` and its vars, so it names production's pair and a bare
  `wrangler deploy` cannot ship into the development source.
  `tests/docs-consistency.test.ts` asserts the split, because nothing else can: the names are strings that
  resolve against an account the repository cannot read.
- **ADR 0013 is untouched.** `LoggerService` stays a tag, `LoggerServiceLive` still returns the singleton, and
  `layers.ts` loses exactly one entry, `TracerLive`. The transport did not change; only the second pipeline
  beside it went away.
- Where this bites: the *Deploy* and *CI* sections of [`CLAUDE.md`](../CLAUDE.md), the *Deploy* section of
  [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md), the clients guide at
  [`apps/web/src/infrastructure/clients/CLAUDE.md`](../apps/web/src/infrastructure/clients/CLAUDE.md), and the
  published wiki's *Observability*, *Cloudflare* and *Workflows* pages.
