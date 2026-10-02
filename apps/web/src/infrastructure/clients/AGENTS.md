# apps/web/src/infrastructure/clients

There is no logger in this folder: it is in [`../logging/`](../logging), and [`../AGENTS.md`](../AGENTS.md)
describes it (the contract, the `stripQuery` rule, the `LoggerService` tag and why it stays one, and why
nothing here carries a trace id; [ADR 0018](../../../../../adr/0018-the-platform-is-the-log-transport.md)).
What is left of Better Stack in this folder is the browser tag, `logging/better-stack/tracking.ts`, in the
table of things that are not services below.

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
| [`payments/stripe/`](./payments/stripe) | `stripe` | `StripeServerService` | `STRIPE_SECRET_KEY` (plus `STRIPE_WEBHOOK_SECRET`, see below) |

They are all merged into `ApplicationLayer` in [`src/infrastructure/layers.ts`](../layers.ts). There is no partial layer: an
entry point providing `ApplicationLayer` builds every client; [`../AGENTS.md`](../AGENTS.md) says what a read at
construction would do.

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
in the closure so it is built once per layer, not once per call. The tagged errors are in
[`src/infrastructure/errors.ts`](../errors.ts): `TursoService` fails with `DatabaseError`, `ResendService` with
`EmailError`, `StripeServerService` with `PaymentError`, and its webhook method with `WebhookError`, whose
`WebhookConfigurationError` subclass marks a missing `STRIPE_WEBHOOK_SECRET` or `STRIPE_SECRET_KEY`; see
[`../api/AGENTS.md`](../api/AGENTS.md) for the status it earns.

## Turso

`service.ts` exposes `query` and `execute`, each taking SQL and positional `InValue[]` args. There is
no ORM and no schema layer in the repo; SQL is written by hand in `services/*/repository.ts`.

Both call `connect()` themselves, so every call is its own connection and nothing spans them. If you need
writes to succeed together, that guarantee does not exist here today.

The first statement on a connection opens a server-side stream that the SDK holds open until `close()` sends a
close request for it, and a Worker has no process exit to sweep up behind it; `withConnection` closes it in a
`finally`. `Connection.close()` swallows its own transport errors and cannot reject, which is what makes it safe
there. `conn.prepare(sql)` would add a `describe` round trip that neither method reads.

**`run` answers `{ changes, lastInsertRowid }`, so there is no `rowsAffected` on it, and reading one is
silent.** `execute` answers `changes`, the count every guarded write in
[`services/payments/repository.ts`](../services/payments/repository.ts) reports back, and the one the contact
slot's conditional insert in [`services/contact/repository.ts`](../services/contact/repository.ts) is read by.
`rowsAffected` *is* the field on the raw Hrana result and on a `batch` `ResultSet`, which is why it reads as
plausible.

The tag carries no `batch`, because nothing calls one.

## Stripe

There is a client on each side, and the split is the trap:

- [`payments/stripe/serverService.ts`](./payments/stripe/serverService.ts): the Effect service. Node SDK, API version pinned in its `apiVersion`,
  and `StripeNode.createFetchHttpClient()` because the Workers runtime has no Node HTTP stack
  ([ADR 0004](../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). Every server-side Stripe
  call goes through this tag. It also exports `WebhookConfigurationError` and `isWebhookConfigurationError`.
- [`payments/stripe/client.ts`](./payments/stripe/client.ts), browser only, `@stripe/stripe-js`, and it does exactly one thing:
  memoise `loadStripe(publishableKey)`. The `StripeClient` class is **not** exported; the module's only
  export is `getStripeClientInstance()`, a lazy singleton that throws if
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is absent, and its only method is `getStripePromise()`, which is
  all [`Donate.tsx`](../../ui/modules/shared/donate/Donate.tsx) needs to hand a promise to Stripe's `<Elements>` provider.
  The confirm-and-classify path that runs in the browser is
  [`../../ui/adapters/payments/checkout.ts`](../../ui/adapters/payments/checkout.ts): it takes the `stripe`
  instance from Elements, calls `stripe.confirmPayment` itself and classifies the outcome as
  `ConfirmPaymentOutcome`.

**The pinned API version decides object *shapes*, not just endpoints, and the tag hides that from the
compiler.** The tag's methods are typed from `StripeNode.*`, which the SDK generates for the version it
ships, so a bump moves the types and the wire format together, and code that reads a response through a
cast is left describing whatever the previous version sent. On the pinned version a `PromotionCode` carries its
coupon under `promotion` rather than at the top level, and a cast that reads the top-level field compiles and
answers `undefined` (see [`../services/payments/AGENTS.md`](../services/payments/AGENTS.md)). When you bump
the SDK, the `apiVersion` string is the smallest part of the change: grep the payment paths for `as unknown as`
and for `expand`, because those are the places the types stop checking anything.

## The clients that are not services

| Path | Why it is not an Effect service |
| --- | --- |
| `payments/stripe/client.ts` | Runs in the browser, where there is no layer to provide |
| [`logging/better-stack/tracking.ts`](./logging/better-stack/tracking.ts) | Not a logger at all: `track()` pushes each event to the `window.betterstack` snippet injected by the UI layer's [`modules/tracking/BetterStackTracking.tsx`](../../ui/modules/tracking/BetterStackTracking.tsx) and to Google Analytics' `window.gtag`, under the same name and properties; `identifyUser()` hands the snippet the email and plan and `gtag` the plan alone. Each target is skipped while its script has not loaded, and both calls do nothing without a `window`. `trackingEnvironment(hostname)` is the pure rule beside them, deciding `development` for `localhost`, `127.0.0.1` and `.workers.dev` hosts and `production` for the rest, because `NODE_ENV` is `production` on a preview Worker too |
| [`tutorial/driver/client.tsx`](./tutorial/driver/client.tsx) | Wraps driver.js, a DOM library. It renders a close icon into the popover, but never imports one: the icon arrives as the injected `closeIcon?: ReactNode` config field, so nothing here reaches into `@ui/*` |

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
`if (this.driver) this.destroy()`. `destroy()` therefore unmounts before delegating, and resets the array so
the hook path calling it a second time is a no-op; without it every popover step leaves a React root mounted
on a detached container, on a singleton that survives the navigation.

`DriverClient` mounts a close button only when a `closeIcon` was injected; `onPopoverRender` leaves
driver.js's own markup alone otherwise. The caller supplies it: the UI layer's [`hooks/useTutorial.tsx`](../../ui/hooks/useTutorial.tsx) passes the
element in the overrides argument to `start()`, which keeps the icon components on the `@ui` side of the layer
boundary; the contract suite fails an import from `@ui/*` here.

## Testing

Each Effect service has a co-located `.test.ts` that mocks the SDK module and asserts the Effect surface: the
success value, that a rejection becomes the right tagged error, and the missing-variable path. The other clients'
tests stub `window`, `driver.js` or `@stripe/stripe-js` instead. [`layers.test.ts`](../layers.test.ts) is the
reference for a test that imports `layers.ts`.

**SQL that has to hold under concurrency runs against a real engine.** [`db/turso/fixture.ts`](./db/turso/fixture.ts)
is `TursoService` over an in-memory `node:sqlite` database, the SQLite that libSQL forks, and each statement answers
on a later task, so two programs run together interleave the way two requests do over HTTP. The contact repository
and use case test their statements on it, through [`../services/contact/fixture.ts`](../services/contact/fixture.ts),
which creates the `contacts` columns the repository writes; the production table lives only in Turso, so nothing
holds the two shapes equal.
