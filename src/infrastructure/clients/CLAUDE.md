# src/infrastructure/clients

## Purpose

One folder per external SDK, and nothing else in the repo constructs one. Four of them are Effect services —
a `Context.Tag` for the interface and a Live `Layer` for the real implementation, so a test can substitute the
tag and never reach the network ([ADR 0002](../../../docs/adr/0002-effect-for-external-service-boundaries.md)).
Four modules here are not services at all, for the reasons given below.

## Effect services

| Folder | SDK | Tag | Required env |
| --- | --- | --- | --- |
| `db/turso/` | `@tursodatabase/serverless` | `TursoService` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| `email/resend/` | `resend` | `ResendService` | `RESEND_API_KEY` |
| `logging/better-stack/` | `@logtail/edge` | `LoggerService` | `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`, `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` |
| `payments/stripe/` | `stripe` | `StripeServerService` | `STRIPE_SECRET_KEY` (plus `STRIPE_WEBHOOK_SECRET`, see below) |

All four are merged into `ApplicationLayer` in `src/infrastructure/layers.ts`. There is no partial layer: an
entry point providing `ApplicationLayer` builds every client — which is why none of them may need anything at
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

`Layer.sync`, not `Layer.effect` — construction is synchronous in all four, and the SDK instance is captured
in the closure so it is built once per layer, not once per call. The `catch` handler always maps to a tagged
error from `src/infrastructure/errors.ts`; a client never lets a raw SDK exception into the error channel.

## Invariants

- **Nothing is read from the environment while the layer is built.** A throw there is an Effect *defect*: the
  `Effect.catchTags` map and the trailing `Effect.catchAll` at the entry point both miss it, the request fails
  as a rejected promise, and — because all four layers are merged — a variable belonging to a service the
  request never touches takes the request down with it. Each client reads its variables inside the call, from
  a lazy getter invoked in the `try` block, so a missing one becomes the method's own tagged error
  (`DatabaseError`, `EmailError`, `PaymentError`) and only fails the routes that reach that client.
- **`STRIPE_WEBHOOK_SECRET` fails as a `WebhookConfigurationError`.** It is a subclass of `WebhookError`, so
  the tag — and therefore the entry point's `catchTags` map — is unchanged; `isWebhookConfigurationError`
  narrows it. The distinction exists because the condition is permanent: answering a misconfiguration with a
  retryable status makes Stripe redeliver the event forever, while a genuine signature mismatch is a 400.
- **Errors are wrapped, never rethrown.** `TursoService` fails with `DatabaseError`, `ResendService` with
  `EmailError`, `StripeServerService` with `PaymentError` (and `WebhookError` on the webhook method). Adding a
  method means choosing its tagged error too.
- **`LoggerServiceLive` returns the singleton.** It is `Layer.sync(LoggerService, () => getBetterStackInstance())`
  — the tag and `getBetterStackInstance()` hand back the *same object*. Substituting the tag in a test does not
  silence a module that calls the singleton directly, and there are several of those.

## Turso

`service.ts` exposes `query`, `execute` and `batch`, each taking SQL and positional `InValue[]` args. There is
no ORM and no schema layer in the repo — SQL is written by hand in `services/*/repository.ts`.

Each of the three calls `connect()` itself, so every call is its own connection and nothing spans them. If you
need two writes to succeed together, that guarantee does not exist here today.

`batch` hands the statements to the driver as they are, `args` included — the driver's `BatchStatement` accepts
the same `{ sql, args }` shape. It runs them without a locking mode, so a failure part-way through leaves the
earlier ones committed.

## Stripe

Two clients, and the split is the trap:

- `payments/stripe/serverService.ts` — the Effect service. Node SDK, API version pinned to `'2026-06-24.dahlia'`,
  and `StripeNode.createFetchHttpClient()` because the Workers runtime has no Node HTTP stack
  ([ADR 0004](../../../docs/adr/0004-cloudflare-workers-as-deployment-target.md)). Every server-side Stripe
  call goes through this tag. It also exports `WebhookConfigurationError` and `isWebhookConfigurationError`.
- `payments/stripe/client.ts` — browser only, `@stripe/stripe-js`. The `StripeClient` class is **not**
  exported; the module's only export is `getStripeClientInstance()`, a lazy singleton that throws if
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is absent. It uses Effect internally to sequence the fallible
  `loadStripe` → `confirmPayment` chain, but it never fails: `Effect.catchAll` turns everything into
  `{ success: false, error }`, with `handleError` narrowing the Stripe error type to one of four codes. Its
  own failures are logged through a **dynamic** `import()` of the BetterStack client, never a static one —
  that module's top-level imports of `@logtail/edge` and `@opennextjs/cloudflare` would otherwise land in the
  client chunk of every `'use client'` component that touches Stripe.

## The clients that are not services

| Path | Why it is not an Effect service |
| --- | --- |
| `payments/stripe/client.ts` | Runs in the browser, where there is no layer to provide |
| `logging/better-stack/client.ts` | Deliberate exception — `getBetterStackInstance()` is what stores, lookups and components use ([ADR 0002](../../../docs/adr/0002-effect-for-external-service-boundaries.md)) |
| `logging/better-stack/tracking.ts` | Not a logger at all: `track()` and `identifyUser()` push to the `window.betterstack` snippet injected by the UI layer's `modules/tracking/BetterStackTracking.tsx`. Both no-op when the snippet has not loaded |
| `tutorial/driver/client.tsx` | Wraps driver.js, a DOM library. It renders a close icon into the popover, but never imports one: the icon arrives as the injected `closeIcon?: ReactNode` config field, so nothing here reaches into `@ui/*` |

`logging/better-stack/client.ts` is the one to read before touching. **A log call cannot fail its caller, and
that is the property everything else here leans on.** Three things hold it up, and all three are load-bearing:

- `getLogtail()` builds the transport on first use and returns `null` — not a throw — when
  `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` or `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` is missing, warning once
  on the console so the misconfiguration is still visible.
- every level goes through `send`, whose `try` swallows a transport that throws synchronously.
- the call itself is fire-and-forget (`void`), so a rejected ingestion never surfaces either.

It matters because the singleton is called *bare*, outside any Effect combinator, from Zustand actions, the
country lookups and both payment handlers. A throw from one of those positions inside an `Effect.gen` is a
defect that neither `Effect.catchTags` nor the trailing `Effect.catchAll` can map — the same failure the
first invariant above describes for layer construction. `Effect.sync` would not help: a throw inside it is
equally a defect. The guarantee has to live in the client, and `describe('a log never fails its caller')` in
`client.test.ts` is what holds it there.

The price is that a lost log is silent, and `getExecutionContext()` reads the Cloudflare context through a
`try` returning `undefined`, so logging off-request works but loses `waitUntil`.

Both `DriverClient` and `StripeClient` keep mutable instance state behind a module-level singleton, so a
second `getDriverClientInstance()` returns the same tour. `DriverClient.start()` destroys a live driver before
building a new one, and the React roots it created for the close buttons are unmounted by
`unmountCloseButtonRoots` — skipping either leaks a root per tour.

**That unmount cannot live in `onDestroyStarted` alone, because driver.js's own `destroy()` does not call
it.** The library's teardown is `h(e = true)`, and it only invokes the `onDestroyStarted` hook when `e` is
truthy; the public `destroy()` is literally `h(false)`. So the user-driven closes — close button, Done on the
last step, ESC, overlay click — reach the hook and clean up, while every *programmatic* teardown skips it:
`useTutorial`'s unmount cleanup when the user navigates away from the planner mid-tour, and `start()`'s own
`if (this.driver) this.destroy()`. Each of those left one React root per rendered popover step mounted on a
detached container, with the animated close icon's motion controls and in-view observers still live, and grew
`closeButtonRoots` without bound on a singleton that survives the navigation. `destroy()` now unmounts before
delegating, and the array is reset so the hook path calling it a second time is a no-op.

`DriverClient` mounts a close button only when a `closeIcon` was injected — `onPopoverRender` leaves
driver.js's own markup alone otherwise. The caller supplies it: the UI layer's `hooks/useTutorial.tsx` passes the
element in the overrides argument to `start()`, which is what keeps the icon components on the `@ui` side of
the layer boundary. Do not import a component here to "fix" a missing icon; pass one in.

## Testing

Each client has a co-located `.test.ts` that mocks the SDK module and asserts the Effect surface: the success
value, and that a rejection becomes the right tagged error. Nothing here is tested against a live service, and
nothing here should be.

A test that transitively imports `src/infrastructure/layers.ts` must mock the four Live layers with
`Layer.empty` rather than set environment variables — `layers.test.ts` is the reference.

Each of the three configured services also asserts the missing-variable path twice: that the layer still
builds, and that the first call fails with that service's tagged error. The logger is the fourth and behaves
differently on purpose — `client.test.ts` asserts that a missing variable makes a log a no-op rather than an
error, because it has no error channel to fail into.
