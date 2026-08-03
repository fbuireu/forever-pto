# src/infrastructure/services/payments

## Purpose

Every Stripe call and every SQL statement behind a Donation. Nothing here decides a flow: each export is an
Effect *program* composed against `StripeServerService`, `TursoService` or `LoggerService`, and something
else — a use-case, a webhook handler, a route — provides `ApplicationLayer` and runs it
([ADR 0002](../../../../docs/adr/0002-effect-for-external-service-boundaries.md)).

The payments table is also the entitlement store. A succeeded row *is* Premium
([ADR 0008](../../../../docs/adr/0008-premium-derived-from-payment.md)), which is why `repository.ts` is
read by the premium activation path as well as by the payment one.

## Files

| File | Exports | Requires |
| --- | --- | --- |
| `repository.ts` | `savePayment`, `updatePaymentStatus`, `updatePaymentCharge`, `getPaymentById`, `getPaymentByEmail`, `countPromoCodeRedemptions`, `normalizePromoCode`, the `PaymentChargeData` shape | `TursoService` |
| `normalizeEmail.ts` | `normalizeEmail(email)` — trim and lower-case, applied on both sides of every address comparison | — |
| `confirmation.ts` | `confirmation(paymentIntentId)` — a `PaymentConfirmationDTO`, or `null` on any failure | `StripeServerService`, `LoggerService` |
| `rateLimit.ts` | `checkRateLimit(ip)` — fails with `RateLimitError` | the Cloudflare `RATE_LIMIT_KV` binding |
| `provider/intent.ts` | `createPaymentIntent(params)` — the Stripe intent behind a Donation | `StripeServerService` |
| `provider/charge.ts` | `retrieveCharge(chargeId)` — normalises a Stripe `Charge` into flat, nullable fields | `StripeServerService` |
| `provider/promoCode.ts` | `validatePromoCode(code, amount)` — a `DiscountInfo`, or a `PromoCodeError` | `StripeServerService`, `TursoService` |

`provider/` is the Stripe side; at the root sit the database, the KV limiter and the address normaliser, and
`confirmation.ts` sits between: a Stripe read that exists only to render the post-checkout page.

## Who calls what

| Caller | Uses |
| --- | --- |
| `payment.ts` (use-case) | `validatePromoCode`, `createPaymentIntent`, `savePayment` (deferred) |
| `activatePremium.ts` (use-case) | `getPaymentByEmail`, `getPaymentById`, `savePayment`, `updatePaymentStatus` |
| `webhook.ts` (use-case) | `getPaymentById`, `savePayment` |
| `paymentSucceeded.ts` / `paymentFailed.ts` (domain handlers) | `getPaymentById`, `updatePaymentStatus`, `updatePaymentCharge`, `retrieveCharge` |
| `src/app/api/payment/route.ts`, `actions/payment.ts` and `src/app/api/payment/activate/route.ts` | `checkRateLimit` |
| The confirmation page | `confirmation` |

The domain handlers importing infrastructure directly is the deliberate asymmetry in
[ADR 0003](../../../../docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md) — see
[`../../../domain/payment/CLAUDE.md`](../../../domain/payment/CLAUDE.md).

## Invariants

**Both payment entry points rate-limit first.** `src/app/api/payment/route.ts` and the
`createPaymentAction` server action are two implementations of one operation and must stay behaviourally
identical; `checkRateLimit` is the first thing either yields. `src/app/api/payment/activate/route.ts` is
the third caller and the only one outside payment creation: it is a public GET that mints a Premium
session, so it is limited on the same `cf-connecting-ip` key and shares the same window. Nothing else is —
not the webhook, and not the `POST /api/check-session` half of session activation.

**`savePayment` is idempotent by SQL, not by check.** `INSERT OR IGNORE` on the primary key is what lets
the webhook re-create a row the deferred write may have lost, and lets `activateWithPayment` write one for
a Donation the webhook has not caught up with yet. Nothing reads before writing, and nothing merges: a
second insert for the same intent is dropped whole, including any column the first one left null.

**Amounts are in Stripe minor units everywhere except `confirmation.ts`.** `createPaymentIntent` multiplies
by 100 on the way in, `paymentDataDTO` keeps minor units for the table, and `confirmation` divides by 100
because its output feeds a screen. Two payment shapes with an `amount` field, two different units.

**The currency is hard-coded to `eur`** in `createPaymentIntent`, and `provider/promoCode.ts` names the same
constant so it can refuse to compare a promotion-code minimum priced in anything else. Those two constants
have to move together.

`PAYMENT_CURRENCY` guards **two** places in that file and both are load-bearing. The promotion-code
`minimum_amount` in another currency is *ignored* — the restriction cannot be evaluated, so it is not
applied. A coupon's own `amount_off` in another currency is *refused* with `COUPON_INVALID`, because
`calculateFinalAmount` subtracts `amount_off / 100` as though it were euros: a $200 discount would come off
a €10 Donation as €2 at whatever the rate happened not to be. Percentage coupons are untouched by either
check — a percentage has no currency to disagree about. A coupon carrying `amount_off` with no `currency`
at all is refused too, since there is nothing to compare.

**The payer's address is compared normalised, never raw.** `normalizeEmail.ts` trims and lower-cases, and
it is applied on both sides of every comparison: `getPaymentByEmail` matches `lower(trim(email))` against a
normalised parameter, and `activateWithPayment` normalises the intent's address and the caller's before
testing them for equality. Email is the only key Premium can be recovered by
([ADR 0008](../../../../docs/adr/0008-premium-derived-from-payment.md)), and SQLite's `=` on `TEXT` is
case-sensitive, so a payer who typed `Name@Example.com` at checkout and `name@example.com` on the way back
was refused access they had paid for. The `lower(trim(...))` on the **column** is what makes rows written
before this normalisation still match; it forgoes an index on `email`, which is the accepted cost for a
table of this size. Do not "optimise" it back to a bare `email = ?` without first migrating the stored
values.

**Every field the entitlement later depends on travels in the intent's `metadata`.** `activateWithPayment`
matches on `metadata.email`, and `paymentDataDTO` reads `promoCode`, `userAgent` and `ipAddress` from there.
Stripe metadata values must be strings, which is why the builder is full of `?? ''` and `.toFixed(2)` — a
value dropped here cannot be recovered from Stripe afterwards.

## Traps

**`SELECT *` gives a row, not a `PaymentData`.** `TursoService.query` casts with `rows as T[]` and maps
nothing, so both readers type the query as the snake_case `PaymentRow` and run it through `toPaymentData`.
That mapper is the only place the column names and the camelCase field names meet, and the only place
`stripe_created_at`, `refunded_at` and `disputed_at` become `Date`s — SQLite stores them as the ISO text
`savePayment` wrote. A column added to the table is invisible to callers until it is added there too.

**Only an expanded `balance_transaction` carries the Stripe processing fee**, which is why `retrieveCharge`
asks for it: `charges.retrieve(chargeId, { expand: ['balance_transaction'] })`. Drop the `expand` and the
field arrives as a bare string id, `getSettlement` returns `{ feeAmount: null, netAmount: null }`, and the
`fee_amount` / `net_amount` columns are written with nulls on every payment row — silently, because nothing
downstream distinguishes "not settled yet" from "never asked for". `application_fee_amount` is the Connect
platform fee, always null for this direct integration, and must never stand in for it.

The SDK still types `balance_transaction` as `string | BalanceTransaction | null` even when expanded, so
`getSettlement` keeps its `typeof === 'string'` guard as the defensive path. The expansion parameter reaches
the SDK through the optional second argument on `StripeServerService.charges.retrieve`; a new expansion is a
change here, not a widening of the tag.

**The rate limiter fails open.** Any error — no Cloudflare context, KV unavailable — is caught into
"not blocked", so payment creation keeps working when the limiter does not. It also only ever increments
while under the limit, so once an IP is blocked the key stops being refreshed and expires 60 s after the
tenth accepted request. It reads the `RATE_LIMIT_KV` binding through `getCloudflareContext({ async: true })`, the form that also
resolves outside a request — so what confines this file to a request is the `cf-connecting-ip` header it
keys on, not the context call
([ADR 0004](../../../../docs/adr/0004-cloudflare-workers-as-deployment-target.md)).

**Promotion-code checks come before coupon checks, and the first error wins.** `validatePromoCode` resolves
the code, re-retrieves it with `expand: ['coupon']` — casting through `unknown` because the SDK type does
not model the expansion — then evaluates the promotion code (active, expiry, redemptions, minimum amount)
and only then the coupon (valid, redemptions, `redeem_by`). A code failing both reports the promotion-code
reason. The `PromoCodeErrorCode` returned is a translation key the UI looks up, not a message.

**The redemption cap is counted from our own table, because Stripe never learns the code was used.** A
promotion code is redeemed by a Checkout Session, an Invoice or a Subscription; this app computes the
discount locally and sends a bare `paymentIntents.create` with the amount already reduced, so
`times_redeemed` stays 0 forever and the `max_redemptions` branch in `getPromotionCodeValidationError` can
never fire on its own. A single-use 90%-off code was therefore permanent for anyone who learned it.
`validatePromoCode` now counts succeeded rows in `payments` whose `promo_code` matches — normalised on both
sides, since the column holds what the user typed while Stripe is queried with the upper-cased form — and
refuses once the count reaches the cap. Three properties are deliberate:

- **It queries only when the code declares a cap.** An uncapped code costs no database round trip.
- **It fails open.** A failed count is caught to zero rather than refusing a paying donor over an outage,
  matching the rate limiter's stance.
- **It is best-effort, not atomic.** Two checkouts racing on the last redemption both see the old count and
  both pass. Closing that needs a reservation row, which is more machinery than a promotional discount
  warrants; the cap is a marketing control, not an entitlement.

**The coupon-level cap is still unenforceable.** `coupon.max_redemptions` counts across every promotion code
sharing that coupon, and the `payments` table records only the code the user typed, so counting by
`promo_code` under-counts whenever one coupon has several codes. That branch remains dead for the same
reason the promotion-code one was. Enforcing it means recording `couponId` on the payment row.

**`MIN_FINAL_AMOUNT` is 0.5, in euros, applied after the discount.** A 100% coupon on a small Donation is
rejected with `MIN_AMOUNT_EXCEEDED` rather than creating a zero-amount intent Stripe would refuse.

**`confirmation` swallows its failure.** It logs and returns `null`, so its error channel is `never` and the
confirmation page cannot distinguish "Stripe is down" from "no such intent". That is intentional — the money
has already moved by then and the page is a receipt, not a gate — but it means a broken Stripe key shows up
only in the logs.

## Testing

Every file has a co-located `.test.ts`, all built the same way: `Layer.succeed(Tag, mock)` for each tag in
`R`, a local `run` helper that provides the merged layer, and `Effect.flip` where the assertion is about the
failure. `rateLimit.test.ts` mocks `@opennextjs/cloudflare` instead, since KV is its only dependency.

No test constructs a Stripe or Turso client. `repository.test.ts` asserts positionally — one statement
keyword via `toContain`, then each value by its index in the argument array — so reordering a column without
reordering its value is caught, while rewording the SQL is not. Add a column at the end or the indices in
that file stop meaning what they say.
