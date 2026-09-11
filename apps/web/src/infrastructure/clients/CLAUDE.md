# apps/web/src/infrastructure/clients

## `LoggerService` is a tag with one adapter, on purpose

It looks like ceremony and the cost is real: every module that logs carries it in `R`, every test that
reaches one stubs its whole surface, and `LoggerServiceLive` hands back the same singleton
`getBetterStackInstance()` does. It
buys one property, verified rather than assumed: because `activateWithEmail` annotates its return type as
requiring `TursoService` and nothing else, a `yield* LoggerService` creeping into its body fails the build at
that function. A singleton call cannot do that, since it is not a requirement and never appears in a type.

**The guarantee is the tag *and* the explicit annotation together.** A program that leaves `R` inferred gets
nothing: the inferred type widens to include `LoggerService` and the build stays green. That makes
"annotate the return type" load-bearing on any Effect program under `@application/use-cases`, not stylistic.

[ADR 0013](../../../../../adr/0013-loggerservice-stays-a-tag.md) records the decision and what it costs, so
the next architecture pass does not re-propose deleting it.

## The log contract, and the one function in it that guards a secret

[`better-stack/contract.ts`](./logging/better-stack/contract.ts) holds `LOG_SERVICE`, the levels the app emits
and `stripQuery`. It is types and constants only, which is what it has always been, though the reason changed:
it was shaped that way so a tail consumer Worker could import it without pulling a transport into a bundle that
had none, and that Worker is gone ([ADR 0017](../../../../../adr/0017-observability-is-the-platform-export.md)).
It carried a `toLogLevel` as well, folding workerd's `log` and `trace` onto `info` on the way out of that
Worker; nothing has called it since, and it went with
[ADR 0018](../../../../../adr/0018-the-platform-is-the-log-transport.md).

**`stripQuery` is the one to understand before touching anything here.** It encodes "a URL in a log context
must not carry its query string, because Stripe appends `payment_intent_client_secret` to the return URL", a
statement about this app's payment flow. Cloudflare's `redact_query_string = true` in
[`wrangler.toml`](../../../wrangler.toml) redacts the **request** URL the platform itself records; it does not
touch a `url` field a caller puts in a structured log context, and that is the leak this guards.
[`api/payment/activate/route.ts`](../../app/api/payment/activate/route.ts) reads
`payment_intent_client_secret` off the query, already emits a log line per failure, and `matchesClientSecret`
is the only guard on a GET that mints a Premium session, so `{ url: request.url }` added while debugging
would have shipped the secret to the sink. The rule is enforced at the seam rather than at call sites:
`BetterStackClient.getFullContext` strips a string `url` on every entry, whichever method emitted it and
whether it arrived in the call or on the base context, so no caller has to remember. A caller that genuinely
wants a query string has to name the field something other than `url`, which is the point: the redaction is
keyed on the field name, not on who wrote it.

**`client.ts` reads the level union rather than restating it.** It imports `LOG_LEVEL` and `LogLevel` and
indexes `console` by the level, so a level added to the contract that `console` has no method for fails to
compile here. `client.test.ts` iterates `LOG_LEVEL` and asserts each level reaches the console method of its
own name and no other.

## Traces are the platform's, and no log line carries a trace id from here

There is no tracer in this folder and no OpenTelemetry dependency in the package. Cloudflare instruments
handler invocations, outbound `fetch` and binding calls itself, attributes `console` output to the active span,
and stamps the trace id on every log record it exports. Because `console` is what this folder's client writes
to ([ADR 0018](../../../../../adr/0018-the-platform-is-the-log-transport.md)), the app's own lines are among
those records and the correlation a helper here used to build by hand arrives without the app producing it.

**That only holds for lines the runtime sees, which is the trap this replaced.** Between
[ADR 0017](../../../../../adr/0017-observability-is-the-platform-export.md) and 0018 the client still posted
over HTTP from inside the Worker, so the spans were in BetterStack, the logs were in BetterStack, and nothing
joined them. A future transport that leaves the runtime again puts it straight back.

**The *correlation.ts* that used to stamp those ids had to go with the wrapper rather than after it**, and the
reason generalises: `trace.getActiveSpan()`
reads `@opentelemetry/api`'s global context manager, and the deleted `@microlabs/otel-cf-workers` wrapper was
the only thing in the tree that ever called `setGlobalContextManager`. Left behind, it would have returned
`undefined` on every call and stamped `{}` on every log line, with its own test still green because that test
installed a context manager by hand. A helper whose test supplies the very thing production stopped providing
is the shape to check for.

**`Effect.withSpan` stays on every use case and is wired to nothing.** Effect's `Tracer.Span` wants a
`traceId`, a `spanId` and a caller-supplied end timestamp on a span built synchronously; the runtime's
`cloudflare:workers` span has none of those and exists only inside a callback, so the bridge cannot be
repointed at it. The calls are free, they name the boundary of each use case, and they are the attachment
point if that changes. `ApplicationLayer` in [`../layers.ts`](../layers.ts) no longer merges a `TracerLive`.

## Purpose

One folder per external SDK, and nothing else in the repo constructs one. Some of them are Effect services:
a `Context.Tag` for the interface and a Live `Layer` for the real implementation, so a test can substitute the
tag and never reach the network ([ADR 0002](../../../../../adr/0002-effect-for-external-service-boundaries.md)).
The rest are not services at all, for the reasons given below.

## Effect services

| Folder | SDK | Tag | Required env |
| --- | --- | --- | --- |
| [`db/turso/`](./db/turso) | `@tursodatabase/serverless` | `TursoService` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| [`email/resend/`](./email/resend) | `resend` | `ResendService` | `RESEND_API_KEY` |
| [`logging/better-stack/`](./logging/better-stack) | none: `console`, exported by the platform | `LoggerService` | none |
| [`payments/stripe/`](./payments/stripe) | `stripe` | `StripeServerService` | `STRIPE_SECRET_KEY` (plus `STRIPE_WEBHOOK_SECRET`, see below) |

They are all merged into `ApplicationLayer` in [`src/infrastructure/layers.ts`](../layers.ts). There is no partial layer: an
entry point providing `ApplicationLayer` builds every client, which is why none of them may need anything at
construction time.

## The shape to copy

```ts
export class FooService extends Context.Tag('FooService')<FooService, { method(): Effect.Effect<T, FooError> }>() {}

export const FooServiceLive = Layer.sync(FooService, () => {
  let client: FooSDK | null = null;

  const getClient = () => {
    if (!client) {
      const key = process.env.FOO_API_KEY;
      if (!key) throw new Error('FOO_API_KEY must be defined');
      client = new FooSDK(key);
    }

    return client;
  };

  return { method: () => Effect.tryPromise({ try: () => getClient().method(), catch: wrapError }) };
});
```

`Layer.sync`, not `Layer.effect`: construction is synchronous in every one of them, and the SDK instance is captured
in the closure so it is built once per layer, not once per call. The `catch` handler always maps to a tagged
error from [`src/infrastructure/errors.ts`](../errors.ts); a client never lets a raw SDK exception into the error channel.

## Invariants

- **Nothing is read from the environment while the layer is built.** A throw there is an Effect *defect*: the
  `Effect.catchTags` map and the trailing `Effect.catchAll` at the entry point both miss it, the request fails
  as a rejected promise, and, because every layer is merged, a variable belonging to a service the
  request never touches takes the request down with it. Each client reads its variables inside the call, from
  a lazy getter invoked in the `try` block, so a missing one becomes the method's own tagged error
  (`DatabaseError`, `EmailError`, `PaymentError`) and only fails the routes that reach that client.
- **`STRIPE_WEBHOOK_SECRET` fails as a `WebhookConfigurationError`.** It is a subclass of `WebhookError`, so
  the tag, and therefore the entry point's `catchTags` map, is unchanged; `isWebhookConfigurationError`
  narrows it. The distinction exists because the condition is permanent: answering a misconfiguration with a
  retryable status makes Stripe redeliver the event forever, while a genuine signature mismatch is a 400.
- **Errors are wrapped, never rethrown.** `TursoService` fails with `DatabaseError`, `ResendService` with
  `EmailError`, `StripeServerService` with `PaymentError` (and `WebhookError` on the webhook method). Adding a
  method means choosing its tagged error too.
- **`LoggerServiceLive` returns the singleton.** It is `Layer.sync(LoggerService, () => getBetterStackInstance())`:
  the tag and `getBetterStackInstance()` hand back the *same object*. Substituting the tag in a test does not
  silence a module that calls the singleton directly, and there are several of those.

## Turso

`service.ts` exposes `query` and `execute`, each taking SQL and positional `InValue[]` args. There is
no ORM and no schema layer in the repo; SQL is written by hand in `services/*/repository.ts`.

Both call `connect()` themselves, so every call is its own connection and nothing spans them. If you need
writes to succeed together, that guarantee does not exist here today.

**Both go through `withConnection`, and the release is structural because nothing else would remember it.**
`connect()` allocates a config object, but the first statement opens a server-side stream that the SDK holds
open until `close()` sends a close request for it. Nothing in the repo ever called `close()`, and this is a
Worker, so there is no process exit to sweep up behind it and every query and every execute leaked one stream.
`withConnection` closes in a `finally`, so the release survives a rejection and cannot be forgotten by the
next method added here. `Connection.close()` swallows its own transport errors and cannot reject, which is
what makes it safe in a `finally` that would otherwise replace a real failure with a closing one.

**They call `conn.all` and `conn.run`, never `conn.prepare`.** `prepare(sql)` fetches column metadata over a
`describe` round trip that neither method reads; the SDK documents `all` and `run` as "like
`prepare(sql).run(args)` but in a single round trip, skips describe". The webhook's succeeded path was taking
twice the round trips from a Worker to a remote database that it needs.

**`run` answers `{ changes, lastInsertRowid }`, so there is no `rowsAffected` on it, and reading one is
silent.** `execute` read `result.rowsAffected` off a statement that has never carried that field, so it
answered `undefined` through a signature promising `number`, and every `rowsAffected > 0` in
[`services/payments/repository.ts`](../services/payments/repository.ts) was `undefined > 0`, which is `false`.
`savePayment` therefore never reported creating a row and `updatePaymentStatus` never reported writing one,
so `handlePaymentFailed` warned on every single delivery. Nothing caught it because `service.test.ts` built
its double from the same misreading: the run double resolved `{ rowsAffected: 1 }`, a shape the SDK does not
produce. The double resolves the SDK's own shape now, and the count case goes red against `rowsAffected`.
`rowsAffected` *is* the field on the raw Hrana result and on a `batch` `ResultSet`, which is where the
misreading came from. It is not the field on `run`.

The tag carried a third method, `batch`, until nothing was found calling it. It ran its statements without a
locking mode, so a failure part-way through left the earlier ones committed, a partial-failure hazard on a
seam no caller used. Adding it back means adding a caller in the same commit.

## Stripe

There is a client on each side, and the split is the trap:

- [`payments/stripe/serverService.ts`](./payments/stripe/serverService.ts): the Effect service. Node SDK, API version pinned to `'2026-07-29.dahlia'`,
  and `StripeNode.createFetchHttpClient()` because the Workers runtime has no Node HTTP stack
  ([ADR 0004](../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). Every server-side Stripe
  call goes through this tag. It also exports `WebhookConfigurationError` and `isWebhookConfigurationError`.
- [`payments/stripe/client.ts`](./payments/stripe/client.ts), browser only, `@stripe/stripe-js`, and it does exactly one thing:
  memoise `loadStripe(publishableKey)`. The `StripeClient` class is **not** exported; the module's only
  export is `getStripeClientInstance()`, a lazy singleton that throws if
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is absent, and its only method is `getStripePromise()`, which is
  all [`Donate.tsx`](../../ui/modules/shared/donate/Donate.tsx) needs to hand a promise to Stripe's `<Elements>` provider.

  **It used to be 137 lines behind that one-function interface, and the other 110 had no caller.**
  `confirmPayment`, `confirmCardPayment`, `getStripe`, `isLoaded`, `handlePaymentResult`, `handleError` and
  a `StripeClientErrors` map were reached only from `client.test.ts`, which spent ~216 lines holding them
  up. The confirm-and-classify path that actually runs is a *second* implementation in
  [`../../ui/adapters/payments/checkout.ts`](../../ui/adapters/payments/checkout.ts): it takes the `stripe` instance from Elements and calls
  `stripe.confirmPayment` itself, classifying the outcome as `ConfirmPaymentOutcome` rather than as one of
  the codes here, none of which had a `checkout.errors.*` key in [`en.json`](../../ui/i18n/messages/en.json), so none of them could
  ever have been shown to a payer. Deleting the dead half also removed this module's only reason to reach
  for the logger and for Effect.

**The pinned API version decides object *shapes*, not just endpoints, and the tag hides that from the
compiler.** The tag's methods are typed from `StripeNode.*`, which the SDK generates for the version it
ships, so a bump moves the types and the wire format together, and code that reads a response through a
cast is left describing whatever the previous version sent. That is not hypothetical here: the
22.3.2 → 22.4.0 bump moved the pin to `'2026-07-29.dahlia'`, where a `PromotionCode` carries its coupon
under `promotion` rather than at the top level, and a lone `as unknown as` in the promo-code service went
on reading the old field and returned `undefined` for every code
(see [`../services/payments/CLAUDE.md`](../services/payments/CLAUDE.md)). When you bump the SDK, the
`apiVersion` string is the smallest part of the change: grep the payment paths for `as unknown as` and for
`expand`, because those are the places the types stop checking anything.

**The tag carries only the methods something calls.** `promotionCodes.retrieve` was on it until the promo-code
service stopped needing a second round trip; it went with the caller rather than staying as surface nothing
exercises. Adding a method here means adding its caller and its error mapping in the same change.

## The clients that are not services

| Path | Why it is not an Effect service |
| --- | --- |
| `payments/stripe/client.ts` | Runs in the browser, where there is no layer to provide |
| [`logging/better-stack/client.ts`](./logging/better-stack/client.ts) | Deliberate exception: `getBetterStackInstance()` is what stores, lookups and components use ([ADR 0002](../../../../../adr/0002-effect-for-external-service-boundaries.md)) |
| [`logging/better-stack/tracking.ts`](./logging/better-stack/tracking.ts) | Not a logger at all: `track()` and `identifyUser()` push to the `window.betterstack` snippet injected by the UI layer's [`modules/tracking/BetterStackTracking.tsx`](../../ui/modules/tracking/BetterStackTracking.tsx). Both no-op when the snippet has not loaded. `trackingEnvironment(hostname)` is the pure rule beside them, deciding `development` for `localhost` and `.workers.dev` hosts and `production` for the rest, because `NODE_ENV` is `production` on a preview Worker too |
| [`tutorial/driver/client.tsx`](./tutorial/driver/client.tsx) | Wraps driver.js, a DOM library. It renders a close icon into the popover, but never imports one: the icon arrives as the injected `closeIcon?: ReactNode` config field, so nothing here reaches into `@ui/*` |

`logging/better-stack/client.ts` is the one to read before touching. **A log call cannot fail its caller, and
that is the property everything else here leans on.** `send` is one statement:

```ts
console[level](JSON.stringify({ ...context, service: LOG_SERVICE, level, message }));
```

wrapped in a `try` that returns. What is load-bearing in it:

- **The spread order.** `context` comes first, so a caller passing `{ level: 'info' }` or
  `{ service: 'something-else' }` cannot relabel its own line. Written the other way round it reads
  identically and lets a log lie about which level and which service produced it; `client.test.ts` asserts
  the level, the message and the service each survive a context that tries to overwrite them, and inverting
  the spread turns three of those cases red.
- **The `try`.** `JSON.stringify` throws on a circular reference and on a `BigInt`. Without it, a caller
  passing either takes down the Zustand action or the payment handler it was logging from.

That second point is why the guarantee has to live here at all: the singleton is called *bare*, outside any
Effect combinator, from Zustand actions, the country lookups and both payment handlers. A throw from one of
those positions inside an `Effect.gen` is a defect that neither `Effect.catchTags` nor the trailing
`Effect.catchAll` can map, the same failure the first invariant above describes for layer construction.
`Effect.sync` would not help: a throw inside it is equally a defect. `describe('a log never fails its caller')`
in `client.test.ts` is what holds it there.

The price is that a lost log is silent, and that the structured fields are serialised here rather than handed
to an API as an object, so the sink parses them back out of the JSON body. That was accepted knowingly; see
[ADR 0018](../../../../../adr/0018-the-platform-is-the-log-transport.md).

**There is no transport to scope to a request any more, and the hazard it existed for is worth keeping in
view.** The client held a `@logtail/edge` batcher: the first call armed a `setTimeout`, later calls joined the
buffer, and the timer's callback ran the `fetch`. As one module-level instance, that batcher armed its timer
inside request A and delivered request B's lines through it, which workerd refuses as
`Cannot perform I/O on behalf of a different request`, cancelling a request left waiting on a promise another
request's context owns. Keying one instance per `ExecutionContext` in a `WeakMap` fixed it, and writing to
`console` removes the class of problem: there is no buffer, no timer and no `fetch`, so nothing can outlive the
request that wrote it. Any future transport that batches has to answer this question again.

Both `DriverClient` and `StripeClient` keep mutable instance state behind a module-level singleton, so a
second `getDriverClientInstance()` returns the same tour, and a second `getStripeClientInstance()` returns
a client that has already started loading Stripe.js, which is the whole point of the memoised promise. `DriverClient.start()` destroys a live driver before
building a new one, and the React roots it created for the close buttons are unmounted by
`unmountCloseButtonRoots`; skipping either leaks a root per tour.

**That unmount cannot live in `onDestroyStarted` alone, because driver.js's own `destroy()` does not call
it.** The library's teardown is `h(e = true)`, and it only invokes the `onDestroyStarted` hook when `e` is
truthy; the public `destroy()` is literally `h(false)`. So the user-driven closes (close button, Done on the
last step, ESC, overlay click) reach the hook and clean up, while every *programmatic* teardown skips it:
`useTutorial`'s unmount cleanup when the user navigates away from the planner mid-tour, and `start()`'s own
`if (this.driver) this.destroy()`. Each of those left one React root per rendered popover step mounted on a
detached container, with the animated close icon's motion controls and in-view observers still live, and grew
`closeButtonRoots` without bound on a singleton that survives the navigation. `destroy()` now unmounts before
delegating, and the array is reset so the hook path calling it a second time is a no-op.

`DriverClient` mounts a close button only when a `closeIcon` was injected; `onPopoverRender` leaves
driver.js's own markup alone otherwise. The caller supplies it: the UI layer's [`hooks/useTutorial.tsx`](../../ui/hooks/useTutorial.tsx) passes the
element in the overrides argument to `start()`, which is what keeps the icon components on the `@ui` side of
the layer boundary. Do not import a component here to "fix" a missing icon; pass one in.

## Testing

Each client has a co-located `.test.ts` that mocks the SDK module and asserts the Effect surface: the success
value, and that a rejection becomes the right tagged error. Nothing here is tested against a live service, and
nothing here should be.

A test that transitively imports `src/infrastructure/layers.ts` must mock every Live layer with
`Layer.empty` rather than set environment variables; [`layers.test.ts`](../layers.test.ts) is the reference.

Each configured service also asserts the missing-variable path twice: that the layer still
builds, and that the first call fails with that service's tagged error. The logger is the exception and has no
variable to be missing: it writes to `console`. What its test asserts in place of that is the shape of the
failure it *can* have, a context that will not serialise, and that the line is dropped rather than thrown,
because it has no error channel to fail into.
