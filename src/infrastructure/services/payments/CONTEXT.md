# infrastructure/services/payments

## Purpose

Stripe integration and payment persistence. Handles payment intent creation, promo code validation, charge retrieval, rate limiting, and all DB read/write for payment records.

## Structure

| File/Folder | Responsibility |
| --- | --- |
| `repository.ts` | DB CRUD — `savePayment`, `updatePaymentStatus`, `updatePaymentCharge` (takes `PaymentChargeData` object), `getPaymentById`, `getPaymentByEmail` |
| `getPaymentConfirmation.ts` | Retrieve a `PaymentConfirmationDTO` from Stripe by payment intent ID; returns `null` on error |
| `rate-limit.ts` | IP-based rate limiter using Cloudflare KV (10 req / 60 s); fails open on error |
| `provider/intent.ts` | Create a Stripe `PaymentIntent` with metadata (email, promoCode, userAgent, ipAddress) |
| `provider/charge.ts` | Retrieve full charge details from Stripe and normalize into `ChargeData` |
| `provider/promo-code.ts` | Validate a promo code against Stripe, check redemption limits and expiry, compute final amount |
| `utils/formatters.ts` | Display helpers for discount info (string formatting only) |

## Non-obvious details

- `updatePaymentCharge` takes a `PaymentChargeData` object (not positional params) — all fields are `string | null` except `feeAmount`/`netAmount` which are `number | null`.
- `getPaymentConfirmation` is an Effect function: requires `StripeServerService | LoggerService` from context. Callers must run it with `Effect.provide(AppLayer)`.
- `rate-limit.ts` uses `getCloudflareContext()` directly — it is only valid inside a Cloudflare Worker request context (API routes, server actions).
- `provider/promo-code.ts` has a `MIN_FINAL_AMOUNT` of 0.5 (50 cents) to prevent zero-amount charges on Stripe.

## Dependencies

- `StripeServerService` — all Stripe calls
- `TursoService` — all DB calls
- `LoggerService` — error logging
- `@application/dto/payment/` — DTO creation for DB records
