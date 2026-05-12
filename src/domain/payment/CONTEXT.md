# domain/payment

## Purpose
Domain layer for the payment/premium flow. Defines domain events, factories, and handlers using Effect.ts for composable error handling and dependency injection.

## Domain concepts

- **PaymentSucceededEvent**: completed payment — carries `paymentIntent`, `paymentId`, `email`, `amount`, `status`.
- **PaymentFailedEvent**: failed payment — carries `paymentIntent`, `paymentId`, `errorMessage`.
- **PaymentEvent**: union type of the two above.
- **Charge enrichment**: workflow that retrieves full charge details from Stripe and persists them to DB; runs inside the success handler but its failure does not block the main flow.

## Structure

| Folder | Contents |
|---|---|
| `events/` | Types (`PaymentSucceededEvent`, `PaymentFailedEvent`, `PaymentEvent`) |
| `events/factory/` | `createPaymentSucceededEvent()`, `createPaymentFailedEvent()` — extract data from the Stripe `PaymentIntent` |
| `handlers/` | `handlePaymentSucceeded()`, `handlePaymentFailed()` — composable effects with DI |

## Non-obvious patterns

- Everything uses `Effect.gen()` — no try/catch. Errors propagate in a typed manner through the effect.
- Charge enrichment fails silently (`Effect.catchAll`) to avoid blocking the payment record.
- The success handler creates the DB record from the webhook if it was not saved upfront (webhook fallback).

## Dependencies

- `@effect/effect` — Effect monad
- Stripe SDK — source of `PaymentIntent` and `Charge`
- `TursoService` — persistence
- `LoggerService` — BetterStack via Effect context

## Out of scope

Payment UI (in `ui/adapters/payments`), premium activation logic (in `application/use-cases/activate-premium`), Stripe configuration (in `infrastructure/clients/payments/stripe`).
