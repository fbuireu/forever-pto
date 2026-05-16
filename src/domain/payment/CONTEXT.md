# domain/payment

## Purpose
Domain layer for the payment/premium flow. Defines domain events, factories, and handlers using Effect.ts for composable error handling and dependency injection.

## Domain concepts

- **PaymentSucceededEvent**: completed payment — carries `paymentId`, `email`, `amount`, `status`, `latestChargeId`, `promoCode`, `userAgent`, `ipAddress`. No raw Stripe objects.
- **PaymentFailedEvent**: failed payment — carries `paymentId`, `status`, `errorMessage`. No raw Stripe objects.
- **PaymentEvent**: union type of the two above.
- **Charge enrichment**: workflow that retrieves full charge details from Stripe and persists them to DB; runs inside the success handler but its failure does not block the main flow.

## Structure

| Folder | Contents |
|---|---|
| `events/` | Types (`PaymentSucceededEvent`, `PaymentFailedEvent`, `PaymentEvent`) |
| `events/factory/` | `createPaymentSucceededEvent()`, `createPaymentFailedEvent()` — extract domain data from the Stripe `PaymentIntent`; all Stripe coupling is contained here |
| `handlers/` | `handlePaymentSucceeded()`, `handlePaymentFailed()` — composable effects with DI |

## Non-obvious patterns

- Everything uses `Effect.gen()` — no try/catch. Errors propagate in a typed manner through the effect.
- Charge enrichment fails silently (`Effect.catchAll`) to avoid blocking the payment record.
- Event types carry no `Stripe.PaymentIntent` reference — all fields are extracted in the factory. This keeps handlers free of SDK coupling.
- The webhook fallback (create DB record if not found) lives in `application/use-cases/webhook.ts`, not in the handler, because it requires `paymentDataDTO` from the application layer.

## Dependencies

- `@effect/effect` — Effect monad
- Stripe SDK — only in `events/factory/events.ts` (source of `PaymentIntent`); handlers do not import Stripe
- `TursoService` — persistence
- `LoggerService` — BetterStack via Effect context

## Out of scope

Payment UI (in `ui/adapters/payments`), premium activation logic (in `application/use-cases/activate-premium`), Stripe configuration (in `infrastructure/clients/payments/stripe`), webhook fallback creation (`application/use-cases/webhook.ts`).
