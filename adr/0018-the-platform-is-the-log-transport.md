# 18. The platform is the log transport

Date: 2026-09-11

## Status

Accepted. Completes [ADR 0017](./0017-observability-is-the-platform-export.md), which moved traces and the
platform's own logs onto Cloudflare's OTLP export and left the app's log lines on a transport of their own.

Amended 2026-09-12. The port this ADR kept unchanged has since changed shape, and the line it writes has
not. `BetterStackClient` and `getBetterStackInstance()` are gone: the writer is a plain `logger` object in
[`apps/web/src/infrastructure/logging/logger.ts`](../apps/web/src/infrastructure/logging/logger.ts), out of
`clients/` because there is no SDK under it, with `info`, `warn`, `error` and `logError` taking one
`{ message, context }` object each, and without `debug`, `logDuration`, `measureAsync`, `withContext` or the
`environment` base field, none of which had a caller outside the class itself (`environment` was also wrong
on every preview Worker, where `NODE_ENV` is `production` too). `LOG_SERVICE` is `forever-pto-web`, the
`<repo>-<package>` spelling contribKit's `contribkit-web` already used. The `noConsole` exemption in
`biome.json` moved with the file. The shape is the one the sibling repositories share, so a reader who knows
one logger knows them all; what stays specific to this app is named in
[`apps/web/src/infrastructure/AGENTS.md`](../apps/web/src/infrastructure/AGENTS.md).

Amended 2026-10-02. A context value that cannot be serialised no longer costs the line; see the amendment at the
end.

Amended 2026-10-02, a second time. The production build keeps the console methods this transport writes through
and strips every other; see the last amendment.

## Context

[ADR 0017](./0017-observability-is-the-platform-export.md) recorded a consequence that turned out to be the
whole of what was still missing: the platform stamps a trace id on the log records **it** exports, and it
exports `console.*` output and uncaught exceptions. Biome's `noConsole` is an error with no allowlist here, so
the app emitted none. Every line written through `LoggerService` went to `BetterStackClient`, which held a
`@logtail/edge` transport and posted to BetterStack over HTTP from inside the Worker, invisible to the runtime.

So the state after 0017 was the worst of the two: the spans were in BetterStack, the logs were in BetterStack,
and nothing joined them. The deleted *correlation.ts* used to read `trace.getActiveSpan()` and stamp
`traceId`/`spanId` by hand, which at least produced a join for the spans the wrapper had opened. Taking the
wrapper out removed the producer of that id and the export did not replace it, because the export never saw
those lines. The repository was paying for tracing and collecting none of the benefit.

The verification that made this concrete, rather than a reading of the code: a real payment in production
produced a trace of `POST` with `ratelimit_run` and three `fetch` children, and, separately, log lines with an
empty trace id column in the same BetterStack source.

What was weighed:

- **Reinstate a correlation helper.** It would need `@opentelemetry/api` back and a context manager to read
  from, and the only thing that ever installed one was the wrapper 0017 deleted. Cloudflare's own span API
  exposes no span id (`spanContext()` is documented as not yet available), so there is nothing for a helper to
  read even with the dependency back.
- **Leave it, and query the two streams separately.** Honest, and it gives up the one thing tracing is for
  here: standing next to the log line that failed.
- **Make `console` the transport.** The runtime attributes `console` output to the active span and stamps the
  trace id when it exports, so the join arrives without the app producing it. This is what the sibling
  repository did, in its own ADR 0026.

The shape of the change matters more than the direction. `BetterStackClient` is the **port**: the API routes,
`zodParse`, `clientLog`, the Premium activation operation, the Zustand stores and the `LoggerService` tag all
call it. Deleting it was never the move. Its public surface is unchanged; only what `send` does underneath is.

## Decision

`send` writes one line per call:

```ts
console[level](JSON.stringify({ ...context, service: LOG_SERVICE, level, message }));
```

Cloudflare exports it, attributes it to the active span and stamps the trace id, so a log line and the span it
failed on answer one query with nothing in this tree producing the join.

**The spread order is load-bearing and is pinned by a test.** `context` goes first, so a caller passing
`{ level: 'info' }` or `{ service: 'something-else' }` cannot relabel its own line: the level the method chose
and the service name win. Writing it the other way round reads identically and was a real bug in the sibling
repository before it was a rule here. `client.test.ts` asserts the level, the message and the service survive
a context that tries to overwrite each, and inverting the spread turns three of its cases red.

Gone with the transport: `@logtail/edge`, the `WeakMap<ExecutionContext, Logtail>`, `createTransport`,
`getTransport`, `getExecutionContext`, the `getCloudflareContext()` call, `UNCONFIGURED_WARNING` and its
`console.warn`, and the `flush()` off a request. There is nothing left to configure and nothing left to drain.
`NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` and `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` go with them, out of
`PUBLIC_ENV`, `environment.d.ts`, `.env.example` and the build step of `_deploy-web.yml`: the host and the
token live on the Cloudflare export destination now.
`NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN` stays, because the browser tag reads it and is unrelated.

`toLogLevel` in `contract.ts` goes too. It folded workerd's `log` and `trace` onto `info` for the tail
consumer Worker, and has had no reader since that Worker was deleted. `stripQuery` stays and keeps its one
reader: it strips the query off a `url` **field a caller puts in a log context**, which is not what
`redact_query_string` covers, since that covers the request URL Cloudflare itself records.

The rejected alternatives are the ones listed above.

## Consequences

- **The structured fields are now parsed rather than received, and that is the price.** Logtail's API took an
  object, so every field arrived as a field. The line is serialised here and the sink parses the JSON body to
  recover them. It was accepted knowingly in the sibling repository and it is accepted knowingly here; if a
  field stops being queryable, this is where to look, and the answer is the sink's parsing rather than the
  caller.
- **The log guarantee moved but did not weaken.** *A log call cannot fail its caller* was held by a `try` around
  a transport that could throw synchronously. It is now held by a `try` around `JSON.stringify`, which throws on
  a circular reference or a `BigInt`. A caller passing either loses the line instead of taking down a Zustand
  action, and `client.test.ts` pins that with a self-referencing context.
- **`console` is the transport, so the `noConsole` exemption is now structural rather than a concession.**
  `biome.json` already scoped it to this one file in `overrides`, for the unconfigured warning that no longer
  exists. The entry stays, the reason is new, and it must not become a repository-wide allowance.
- **The browser keeps logging and stops reaching BetterStack directly.** The same client is called from the
  stores and the country lookups, where `console` goes to the browser console and reaches BetterStack only
  through the RUM tag, and only once analytics consent is given. Before this, those lines posted over HTTP
  regardless of consent, which is the half of the trade that is an improvement rather than a cost.
- **The reason the client is imported dynamically has expired.** The UI layer and the stores reach it through
  `import()` because its module graph pulled `@logtail/edge` and `@opennextjs/cloudflare` into any chunk that
  touched it. It imports `./contract` and nothing else now, so a static import would cost nothing. The dynamic
  imports are left in place: changing them is a separate decision, and the guides that state the old reason
  have been corrected rather than left to mislead.
- **The `peerDependencyRules` entry in `pnpm-workspace.yaml` is gone with the package it existed for.**
  `@logtail/edge` was the only thing asking for `@cloudflare/workers-types` v4 against wrangler's optional v5
  peer, which is exactly the condition the root guide said to delete it on.
- **[ADR 0002](./0002-effect-for-external-service-boundaries.md) and
  [ADR 0013](./0013-loggerservice-stays-a-tag.md) are not reopened.** Where logging lives, and why
  `LoggerService` is still a tag with one adapter, are both about the port and the `R` channel, neither of
  which the transport touches. `LoggerServiceLive` still returns the same singleton, and the tag's interface is
  byte for byte what it was.
- Where this bites: the *Deploy* section of [`apps/web/AGENTS.md`](../apps/web/AGENTS.md), the clients guide at
  [`apps/web/src/infrastructure/clients/AGENTS.md`](../apps/web/src/infrastructure/clients/AGENTS.md), the
  dynamic-import paragraphs in [`apps/web/src/ui/AGENTS.md`](../apps/web/src/ui/AGENTS.md) and
  [`apps/web/src/application/stores/AGENTS.md`](../apps/web/src/application/stores/AGENTS.md), the
  `noConsole` gotcha in [`AGENTS.md`](../AGENTS.md), and the published wiki's *Observability*, *Secrets*
  and *Tooling* pages.

## Amendment, 2026-10-02: an unserialisable value no longer costs the line

**The guarantee below held for the caller and failed the sink.** *A log call cannot fail its caller* was kept by
dropping the whole line when `JSON.stringify` threw, so a context carrying a circular reference or a `BigInt`
left no record that anything had happened, which is the one thing a log line exists to leave. And `logError`
described the error before the `try`, so a thrown object with no prototype and no JSON (`String()` throws on it)
reached the caller after all.

**Every method now runs inside one `try`, and each context value is tried on its own.** A value `JSON.stringify`
cannot write is written as `"[unserializable]"`, so the line still reaches Better Stack with its service, level,
message and every other field; an own field of an `Error` gets the same treatment inside `error`, so the message,
name and stack survive it; and a thrown object that has neither JSON nor a `toString` is described by its tag.
A line that serialised before is byte for byte what it was. `logger.ts` is still byte for byte what the
sibling repositories carry, and they changed with it.

## Amendment, 2026-10-02: the production build keeps the transport's levels

**`console` is the transport, and the production build deleted `console` calls.** `compiler.removeConsole: isProd`
in [`apps/web/next.config.ts`](../apps/web/next.config.ts) strips every literal `console.*` call from the app's
code in a production build. The logger's lines survived only because `write` indexes `console[level]`, which the
transform does not match, so a rewrite of `write` into literal calls would have deleted every line this ADR
exists to deliver, with nothing failing.

**The build now excludes the logger's levels by name.** `removeConsole` is `{ exclude: Object.values(LOG_LEVEL) }`
in production, so `info`, `warn` and `error` survive however they are written and a level `LOG_LEVEL` gains is
kept with no second edit, while `console.log`, `console.debug` and the rest are still deleted. The contract suite
loads the production config and holds the list equal to `LOG_LEVEL`. The cost is small and visible: Next's own
route templates are compiled as the app's code, so their three `console.error` calls on failure paths and one
`console.warn` now reach the platform log too, as plain text beside the JSON lines, where before they were
deleted with everything else.
