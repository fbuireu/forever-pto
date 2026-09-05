# 15. Traces reach BetterStack by wrapping the OpenNext entrypoint

Date: 2026-09-05

## Status

Accepted.

## Context

The app Worker had logs in BetterStack and no traces anywhere a person could query. Two things looked like
traces and were not. `wrangler.toml` enables `[observability.traces]`, which Cloudflare renders in its own
dashboard and exports nowhere: there is no destination setting, and the tail consumer under `workers/tail/`
receives `logs`, `exceptions` and request metadata but no spans, so it cannot forward what it never gets.
The BetterStack source the logs land on is an OpenTelemetry source with an empty SPANS stream, waiting for
OTLP on `/v1/traces` of the same host, under the same token.

Producing spans from a Next app on workerd has one obvious answer and it does not work. Next's instrumentation hook
with `@vercel/otel` or `@opentelemetry/sdk-node` is the Node SDK: it patches `http`, leans on
`async_hooks` and `perf_hooks`, and its exporter speaks Node's `http`, none of which the Workers runtime
offers the way the SDK expects. The library built for Workers, `@microlabs/otel-cf-workers`, takes the other
shape entirely: it wraps the Worker's `export default`, opens a root span per `fetch` invocation, patches the
global `fetch` so every outbound call becomes a child span, and exports OTLP over `fetch`. That is exactly
the seam OpenNext generates for us, `.open-next/worker.js`, and exactly the file this tree does not own.

The alternatives were:

- **Stay with Cloudflare's traces.** Zero code, but they live in a dashboard nobody alerts from, expire on
  Cloudflare's schedule, and cannot be joined to the logs already in BetterStack. The point of a trace here
  is to sit beside the log line that failed.
- **Hand-roll OTLP.** Build spans and POST `/v1/traces` ourselves through `LoggerService`. It reaches the same
  destination with no library, and it means writing a span exporter, W3C trace-context propagation and a
  sampler by hand, and instrumenting every `fetch` call site one at a time. Everything the library does for
  free, done worse.
- **Wrap the generated entrypoint.** A five-line `worker.ts` imports `.open-next/worker.js`, wraps it in
  `instrument`, and `wrangler.toml` names the wrapper as `main`. OpenNext keeps generating what it generates;
  wrangler bundles the wrapper on top. The cost is a file in the tree that imports a file the tree does not
  contain until a build has run, and a dependency on the shape of what OpenNext emits: an ES module whose
  default export is the handler.

## Decision

The app Worker's entrypoint is [`apps/web/worker.ts`](../apps/web/worker.ts), which imports the handler OpenNext
writes to `.open-next/worker.js` and exports `instrument(handler, tracingConfig)`. `wrangler.toml` names it as
`main`; the OpenNext build is untouched and still emits `.open-next/worker.js`, which nothing deploys directly
any more.

`tracingConfig` lives in [`apps/web/src/infrastructure/clients/logging/better-stack/tracing.ts`](../apps/web/src/infrastructure/clients/logging/better-stack/tracing.ts),
beside the log contract, because the spans go to the same BetterStack source as the logs and stamp the same
`LOG_SERVICE` name, so one query reaches both. It reads two Worker bindings, `BETTER_STACK_INGESTING_URL` and
`BETTER_STACK_SOURCE_TOKEN`, the names the tail Worker already uses, and the deploy hands them over the same
way: the host as a `--var`, the token inside `--secrets-file`. When either is unbound it returns a configuration
with no exporter, so a hand-run deploy without them traces into nothing rather than into a broken address.

Spans are head-sampled at `TRACE_SAMPLING_RATIO`, the same fraction `wrangler.toml` gives Cloudflare's own
traces, and `acceptRemote` is off so no caller can raise our sampling by sending a `traceparent`.
Cloudflare's traces stay enabled: they cost nothing to keep and they are the only trace view that survives
BetterStack being down.

The rejected alternatives are the Node SDK, which does not run here, and hand-rolled OTLP, which would be the
library rewritten with fewer features.

## Consequences

- **`open-next.d.ts` is load-bearing.** `.open-next/` is generated and gitignored, so `tsc` cannot resolve
  `./.open-next/worker.js` on a clean checkout. The wildcard ambient module in that file is what types the
  import, and it describes the handler structurally. If OpenNext stops exporting a default handler with a
  `fetch` method, the build breaks in wrangler and not in `tsc`; the declaration has to be kept honest by hand.
- **The wrapper is bundled by wrangler, not by OpenNext.** It cannot use the `@…/*` path aliases Next resolves
  through `tsconfig.json`; it imports by relative path, the way `workers/tail/index.ts` does. A test can import
  `tracing.ts`; nothing can unit-test `worker.ts` itself, because its import does not exist without a build.
  `wrangler deploy --dry-run` after `pnpm cf:build` is what proves it bundles.
- **Two Workers now read `BETTER_STACK_INGESTING_URL` and `BETTER_STACK_SOURCE_TOKEN`.** Both come from the same
  two GitHub variables, `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` and `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`, on
  the environment being deployed, and `_deploy-web.yml` fails before deploying when either is empty. Reissuing
  the BetterStack source is still "update the two variables and redeploy".
- **Every outbound `fetch` is a span**, Stripe, Turso and the R2 cache included, at the sampled rate. That is the
  value and it is also the volume: BetterStack bills by it, and the ratio is the dial.
- **The `spanProcessors: []` fallback is silent by design**, which is the opposite of what the tail Worker does
  with a missing host. The tail Worker can report through its own invocation logs; the wrapper runs inside the
  app Worker, where a `console.error` per request would land in the very logs it is trying to correlate.
  `tracing.test.ts` pins the fallback so it cannot turn into an export to `undefined/v1/traces`.
- Where this bites: the *Deploy* section of [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md), and the clients guide
  at [`apps/web/src/infrastructure/clients/CLAUDE.md`](../apps/web/src/infrastructure/clients/CLAUDE.md).
