# infrastructure/clients

## Purpose

Effect service wrappers around external SDKs. Each client exposes a `Context.Tag` (the interface) and a Live `Layer` (the real implementation). Tests substitute the tag with a mock layer — the SDK is never called in tests.

## Pattern

```ts
export class FooService extends Context.Tag('FooService')<FooService, { method(): Effect<...> }>() {}

export const FooServiceLive = Layer.effect(FooService, Effect.gen(function* () {
  const client = new FooSDK(config);
  return { method: () => Effect.tryPromise(() => client.method()) };
}));
```

## Clients

| Folder | SDK | Tag | Env vars |
| --- | --- | --- | --- |
| `db/turso/` | `@libsql/client` | `TursoService` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| `email/resend/` | `resend` | `ResendService` | `RESEND_API_KEY` |
| `logging/better-stack/` | `@logtail/node` | `LoggerService` | `LOGTAIL_SOURCE_TOKEN` |
| `payments/stripe/` | `stripe` (server) + `@stripe/stripe-js` (browser) | `StripeServerService` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

## Non-obvious details

- `stripe/client.ts` is **browser-only** (`StripeClient` wraps `loadStripe()`). All server-side Stripe must go through `StripeServerService`.
- `logging/better-stack/client.ts` exports `getBetterStackInstance()` — a singleton for non-Effect contexts (pure utility functions without a layer). Do not use it in Effect code; use `LoggerService` instead.
- `logging/better-stack/tracking.ts` is client-side browser event tracking. Separate from the server-side logger.
