# clients

## Purpose
Singleton client instances for external services. Encapsulates initialization, credentials, retries, and response shape. Infrastructure services depend on these clients, never the other way around.

## Available clients

| Client | Service | Access pattern |
|---|---|---|
| `db/turso/` | Turso (serverless SQLite) | `getTursoClientInstance()` |
| `email/resend/` | Resend (email delivery) | `getResendClientInstance()` |
| `logging/better-stack/` | BetterStack (Logtail) | `getBetterStackInstance()` |
| `payments/stripe/` | Stripe (payments) | `getStripeServerInstance()` / `getStripePromise()` |

## Response shape

All clients use a discriminated response:

```typescript
{ success: true; data: T } | { success: false; error: string }
```

Do not throw exceptions from public client methods — catch and return `{ success: false }`.

## Patterns

- **Singleton with null-coalescing**: getters instantiate once and reuse.
- **Stripe has two entry points**: `getStripePromise()` for the browser client, `getStripeServerInstance()` for Node/Edge.
- **BetterStack is injected into other clients** (Turso, Resend, Stripe) for centralized logging — do not use `console` inside clients.
- Credentials are read from environment variables at instantiation time; missing vars throw at startup (fail-fast).

## Out of scope

Business logic (use services), DTO transformation (use `application/dto`), domain event handling (use `domain/`).
