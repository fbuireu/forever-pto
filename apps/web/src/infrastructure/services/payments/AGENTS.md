# apps/web/src/infrastructure/services/payments

## Purpose

Every Stripe call and every SQL statement behind a Donation. Nothing here decides a flow: each Stripe and SQL
export is an Effect *program* composed against `StripeServerService`, `TursoService` or `LoggerService`, and
something else (a use-case, a webhook handler, a route) provides `ApplicationLayer` and runs it
([ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md)). The normalisers and the
metadata helpers beside them are plain functions.

The payments table is also the entitlement store. A succeeded row *is* Premium
([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)), which is why [`repository.ts`](./repository.ts) is
read by the premium activation path as well as by the payment one.

## Files

| File | Exports | Requires |
| --- | --- | --- |
| `repository.ts` | `savePayment`, `updatePaymentStatus`, `updatePaymentCharge`, `getSucceededPaymentByEmail`, `countPromoCodeRedemptions`, the `PaymentChargeData` shape | `TursoService` |
| [`normalizeEmail.ts`](./normalizeEmail.ts) | `normalizeEmail(email)`: trim and lower-case, applied on both sides of every address comparison | None |
| [`normalForms.ts`](./normalForms.ts) | `PAYMENT_CURRENCY` and `normalizePromoCode(code)`: the forms every payment value has to be written in, at every site that writes one | None |
| [`confirmation.ts`](./confirmation.ts) | `confirmation(paymentIntentId)`: a `PaymentConfirmationDTO`, or `null` on any failure; warns through the tag when the intent is not `succeeded`, so the page renders and never logs | `StripeServerService`, `LoggerService` |
| [`rateLimit.ts`](./rateLimit.ts) | `checkRateLimit(ip)`: fails with `RateLimitError` | the Cloudflare `PAYMENT_RATE_LIMITER` binding |
| [`provider/intent.ts`](./provider/intent.ts) | `createPaymentIntent(params)`: the Stripe intent behind a Donation, which takes its metadata block from `donationMetadata` | `StripeServerService` |
| [`provider/metadata.ts`](./provider/metadata.ts) | `donationMetadata(params)` and `readDonationMetadata(intent)`: the writer and the reader of that block, and `clampMetadata(value)`, the clamp every free-text field goes through | None |
| [`provider/charge.ts`](./provider/charge.ts) | `retrieveCharge(chargeId)`: normalises a Stripe `Charge` into flat, nullable fields | `StripeServerService` |
| [`provider/promoCode.ts`](./provider/promoCode.ts) | `validatePromoCode({ code, amount })`: a `DiscountInfo`, or a `PromoCodeError` | `StripeServerService`, `TursoService` |

`provider/` is the Stripe side; at the root sit the database, the rate limiter and the address normaliser, and
`confirmation.ts` sits between: a Stripe read that exists only to render the post-checkout page.

## Who calls what

| Caller | Uses |
| --- | --- |
| `payment.ts` (use-case) | `validatePromoCode`, `createPaymentIntent`, `savePayment` (deferred) |
| `activatePremium.ts` (use-case) | `getSucceededPaymentByEmail`, `savePayment`, `updatePaymentStatus`, `readDonationMetadata`, `normalizeEmail` |
| [`webhook.ts`](../../../application/use-cases/webhook.ts) (use-case) | `savePayment`, `readDonationMetadata` |
| [`events.ts`](../../../domain/payment/events/factory/events.ts) (domain event factory) | `readDonationMetadata` |
| [`paymentSucceeded.ts`](../../../domain/payment/handlers/paymentSucceeded.ts) / [`paymentFailed.ts`](../../../domain/payment/handlers/paymentFailed.ts) (domain handlers) | `updatePaymentStatus`, `updatePaymentCharge`, `retrieveCharge` |
| [`api/operations/payment.ts`](../../api/operations/payment.ts) and [`api/operations/activatePremium.ts`](../../api/operations/activatePremium.ts) | `checkRateLimit` |
| The confirmation page | `confirmation` |

The repository reads only by email and by promotion code: no function reads a payment by its id, which is what
keeps the webhook handlers from reading a row before they write it.

The domain handlers importing infrastructure directly is the deliberate asymmetry in
[ADR 0003](../../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md); see
[`../../../domain/payment/AGENTS.md`](../../../domain/payment/AGENTS.md).

## Invariants

**`checkRateLimit` has no caller outside `api/operations/`** (`createPaymentRequest` and
`activatePremiumRequest`), so every transport over them inherits the limit; which endpoints that covers is
[`../../api/AGENTS.md`](../../api/AGENTS.md)'s to state.

**`savePayment` is idempotent by SQL, not by check.** `INSERT OR IGNORE` on the primary key is what lets
the webhook re-create a row the deferred write may have lost, and lets the donation activation path write
one for a Donation the webhook has not caught up with yet. Nothing reads before writing, and nothing merges: a
second insert for the same intent is dropped whole, including any column the first one left null.

**`updatePaymentStatus` is guarded the same way, and both answer whether they wrote.** Its `WHERE` carries
`AND status != 'succeeded'`, so a succeeded row, the entitlement, cannot be overwritten by a late or
redelivered event, and both functions return a `boolean` off the count `execute` answers.

**Amounts are in Stripe minor units everywhere except `confirmation.ts`.** `createPaymentIntent` multiplies
by 100 on the way in, `paymentDataDTO` keeps minor units for the table, and `confirmation` divides by 100
because its output feeds a screen. Payment shapes with an `amount` field, in different units.

**The currency is `PAYMENT_CURRENCY` from [`normalForms.ts`](./normalForms.ts)**, imported by `createPaymentIntent` (which
prices the intent) and by `provider/promoCode.ts`, which refuses to compare a promotion-code minimum
priced in anything else; one import each is what makes them move together.

`normalizePromoCode` sits beside it for the same reason: the code sent to Stripe's `promotionCodes.list` and the
code the redemption count is keyed by have to be the same string.

`PAYMENT_CURRENCY` guards **more than one** place in that file and each is load-bearing. The promotion-code
`minimum_amount` in another currency is *ignored*: the restriction cannot be evaluated, so it is not
applied. A coupon's own `amount_off` in another currency is *refused* with `COUPON_INVALID`, because
`calculateFinalAmount` subtracts `amount_off / 100` as though it were euros: a $200 discount would come off
a €10 Donation as €2 at whatever the rate happened not to be. Percentage coupons are untouched by either
check; a percentage has no currency to disagree about. A coupon carrying `amount_off` with no `currency`
at all is refused too, since there is nothing to compare.

**The payer's address is compared normalised, never raw.** `normalizeEmail.ts` trims and lower-cases, and
it is applied on both sides of every comparison: `getSucceededPaymentByEmail` matches `lower(trim(email))` against a
normalised parameter, and `activateWithClaimedPayment` normalises the intent's address and the caller's
before testing them for equality. Email is the only key Premium can be recovered by
([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)), and SQLite's `=` on `TEXT` is
case-sensitive, so a payer who typed `Name@Example.com` at checkout and `name@example.com` on the way back
would be refused access they had paid for. The `lower(trim(...))` on the **column** is what makes rows written
before this normalisation still match; it forgoes an index on `email`, which is the accepted cost for a
table of this size. Do not "optimise" it back to a bare `email = ?` without first migrating the stored
values.

**Every field the entitlement later depends on travels in the intent's `metadata`.** Both donation entry
points read the payer address from `metadata.email`, and the use cases read `promoCode`, `userAgent` and `ipAddress` from there, all through `readDonationMetadata`.
Stripe metadata values must be strings, which is why the builder is full of `?? ''` and `.toFixed(2)`; a
value dropped here cannot be recovered from Stripe afterwards.

**`provider/metadata.ts` holds the writer and the reader of that block, so the keys are spelled in one file, and
`createPaymentIntent` is the only caller of the writer.** `metadata.test.ts` reads what `donationMetadata` wrote back
through `readDonationMetadata`, so a key renamed on one side fails there. `readDonationMetadata` takes the first non-blank of `metadata.email` and `receipt_email` after trimming. It returns `email: string | undefined` rather than failing, because the
callers owe different errors: `MissingDonorEmailError` in the factory, `ValidationError` at the use-case.

**Stripe caps a metadata value at 500 characters.** `promoCode`, `userAgent` and `ipAddress` go through
`clampMetadata`: a `User-Agent` over the cap is trivially forgeable and occurs in the wild from AV- and
enterprise-injected headers, and it makes `paymentIntents.create` reject the whole call. `promoCode` reaches
the same place unvalidated whenever it is whitespace: `createPayment` guards with
`if (validated.promoCode?.trim())`, so `'   '` skips `validatePromoCode` and is written verbatim.

**`email` is deliberately *not* clamped, and must not be.** It is the only key Premium can ever be recovered
by ([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)) and `activateWithClaimedPayment`
matches on it exactly, so a truncated address would silently orphan the payer, the same class of failure as writing
a blank one. An over-long address is refused earlier instead, by the `.max()` on
`createPaymentSchemaWithMessages`, so it fails as a `ValidationError` and a 400 rather than reaching Stripe.
`promoCode` carries a `.max()` there too, which is what stops the whitespace bypass carrying an arbitrarily
long string. Adding a new free-text metadata field means deciding which of these it is. Both `.max()` rules
carry a message key; see [`../../../application/dto/AGENTS.md`](../../../application/dto/AGENTS.md).

## Traps

**A payment is written with `NewPayment` and read back as `PaymentData`, and they are different
widths.** `PaymentData` is the stored record, one field per column. `NewPayment` is the subset the
`PaymentIntent` actually knows, and `paymentDataDTO` produces that; most of the rest are filled minutes later by
`updatePaymentCharge` off the expanded charge, and the refund, dispute, parent and origin columns have no
writer anywhere in this codebase.

**The `INSERT` names every column and binds a literal `null` to the ones with no value yet, and that is
deliberate.** Omitting a column is not the same statement: a `NOT NULL` column with a `DEFAULT` takes the
default when omitted and rejects an explicit `NULL`. The schema lives in Turso, not in this repo, so nothing
here can prove which columns those are. Trimming the column list is a separate change that needs the real
schema in front of you. The write tests pass `NewPayment` and the read tests their own `BASE_STORED_PAYMENT`.

**`SELECT *` gives a row, not a `PaymentData`.** `TursoService.query` casts with `rows as T[]` and maps
nothing, so both readers type the query as the snake_case `PaymentRow` and run it through `toPaymentData`.
That mapper is the only place the column names and the camelCase field names meet, and the only place
`stripe_created_at`, `refunded_at` and `disputed_at` become `Date`s; SQLite stores them as the ISO text
`savePayment` wrote. A column added to the table is invisible to callers until it is added there too.

**Only an expanded `balance_transaction` carries the Stripe processing fee**, which is why `retrieveCharge`
asks for it: `charges.retrieve(chargeId, { expand: ['balance_transaction'] })`. Drop the `expand` and the
field arrives as a bare string id, `getSettlement` returns `{ feeAmount: null, netAmount: null }`, and the
`fee_amount` / `net_amount` columns are written with nulls on every payment row, silently, because nothing
downstream distinguishes "not settled yet" from "never asked for". `application_fee_amount` is the Connect
platform fee, always null for this direct integration, and must never stand in for it.

The SDK still types `balance_transaction` as `string | BalanceTransaction | null` even when expanded, so
`getSettlement` keeps its `typeof === 'string'` guard as the defensive path. The expansion parameter reaches
the SDK through the optional second argument on `StripeServerService.charges.retrieve`; a new expansion is a
change here, not a widening of the tag.

**The rate limiter fails open.** Any error (no Cloudflare context, the binding unavailable) is caught into
"not blocked", so payment creation keeps working when the limiter does not. It reads the
`PAYMENT_RATE_LIMITER` binding through `getCloudflareContext({ async: true })`, the form that also resolves
outside a request, so what confines this file to a request is the client address it keys on, not
the context call ([ADR 0004](../../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**It counts on the platform, because a KV counter cannot be made correct here.** Workers KV offers neither
compare-and-swap nor atomic increment, so a read-modify-write lets a parallel burst from one IP, which is
exactly the shape of card-testing traffic, through to `stripe.paymentIntents.create`.
`simple = { limit = 10, period = 60 }` in `wrangler.toml` owns both bounds (`period` accepts only 10 or 60),
so there is no limit, window or key prefix in this file. This is distinct from the fail-open stance above,
which covers errors only, and from the "best-effort, not atomic" caveat granted to the promo-code cap below:
that one is a marketing control, this one is the only thing in front of the card processor.

**A promotion code carries its coupon under `promotion`, not at the top level.** On the API version this repo
pins, `PromotionCode` has `promotion: { type: 'coupon', coupon: string | Coupon | null }` and **no** `coupon`
field of its own, so a cast that reads `promotionCode.coupon` compiles, answers `undefined` and fails every valid
code with `FAILED_TO_LOAD`. The coupon is a bare id unless asked for, so `list` carries
`expand: ['data.promotion.coupon']`, one round trip in all. That expansion is the load-bearing part: without
it `promotion.coupon` is a string and the guard refuses it. `expand: ['coupon']` is not rejected by the API; it
is simply ignored, which is why that failure is silent.

**Promotion-code checks come before coupon checks, and the first error wins.** `validatePromoCode` resolves
the code, then evaluates the promotion code (active, expiry, redemptions, minimum amount)
and only then the coupon (valid, redemptions, `redeem_by`, currency). A code failing both reports the
promotion-code reason. The `PromoCodeErrorCode` returned is a translation key the UI looks up, not a message.

**Some branches here are unreachable through this path, and each is deliberate.** `list` is called with
`active: true`, which the API honours by hiding deactivated codes entirely, so a code the operator switched
off comes back as an empty list and reports `INVALID_OR_EXPIRED` from the length check, never from the
`promotionCode.active === false` test below it. And Stripe refuses to *create* a coupon whose `redeem_by` or
a code whose `expires_at` is already in the past, so those comparisons can only fire on an object that
aged into expiry.

**`calculateFinalAmount` rounds to cents before returning**, because `MIN_FINAL_AMOUNT` compares the final
amount: unrounded, a 90% code on a €5 Donation computes `0.4999999999999999` and falls under the €0.50 floor it
exactly meets.

**The redemption cap is counted from our own table, because Stripe never learns the code was used.** A
promotion code is redeemed by a Checkout Session, an Invoice or a Subscription; this app computes the
discount locally and sends a bare `paymentIntents.create` with the amount already reduced, so
`times_redeemed` stays 0 forever and the `max_redemptions` branch in `getPromotionCodeValidationError` can
never fire on its own. `validatePromoCode` counts succeeded rows in `payments` whose `promo_code` matches
(normalised on both sides, since the column holds what the user typed while Stripe is queried with the
upper-cased form), and refuses once the count reaches the cap. These properties are deliberate:

- **It queries only when the code declares a cap.** An uncapped code costs no database round trip.
- **It fails open.** A failed count is caught to zero rather than refusing a paying donor over an outage,
  matching the rate limiter's stance.
- **It is best-effort, not atomic.** Two checkouts racing on the last redemption both see the old count and
  both pass. Closing that needs a reservation row, which is more machinery than a promotional discount
  warrants; the cap is a marketing control, not an entitlement.

**The coupon-level cap is unenforceable.** `coupon.max_redemptions` counts across every promotion code
sharing that coupon, and the `payments` table records only the code the user typed, so counting by
`promo_code` under-counts whenever one coupon has several codes, so that branch is dead for the same reason the
promotion-code one would be without the count. Enforcing it means recording `couponId` on the payment row.

**`MIN_FINAL_AMOUNT` is 0.5, in euros, applied after the discount.** A 100% coupon on a small Donation is
rejected with `MIN_AMOUNT_EXCEEDED` rather than creating a zero-amount intent Stripe would refuse.

**`confirmation` swallows its failure.** It logs and returns `null`, so its error channel is `never` and the
confirmation page cannot distinguish "Stripe is down" from "no such intent". That is intentional (the money
has already moved by then and the page is a receipt, not a gate), but it means a broken Stripe key shows up
only in the logs.

## Testing

[`rateLimit.test.ts`](./rateLimit.test.ts) mocks `@opennextjs/cloudflare`, since the rate-limiting binding is its only
dependency; its burst case drives 200 concurrent `checkRateLimit` calls to pin that the count is the
platform’s and not a local read-modify-write. [`promoCode.test.ts`](./provider/promoCode.test.ts) nests the
coupon under `promotion` and carries a case asserting the code never reaches for a top-level `coupon`.

**`repository.test.ts` reads the column order out of the SQL and asserts against that, rather than against
literal indices.** `insertedColumns` slices the `INSERT`'s own column list, `updatedColumns` matches the
`SET x = ?` assignments and appends the `WHERE id` key, and `boundRow` zips either list against the argument
array, so the expectation is a named row, `{ email: 'user@example.com', … }`, and a column inserted mid-list
shifts every name-value pair below it and fails loudly. It also ties the counts: `sql.split('?')` against
`args.length + 1`, so a placeholder added without its value, or the reverse, is caught on its own.
`updatePaymentStatus`'s test also pins the SQL's `WHEN ? = 'succeeded'` against `PAYMENT_SUCCEEDED`.

**[`repository.ts`](./repository.ts) spells `'succeeded'` in its SQL rather than binding `PAYMENT_SUCCEEDED`**
(`updatePaymentStatus`, `getSucceededPaymentByEmail`, `countPromoCodeRedemptions`).
[`tests/docs-consistency.test.ts`](../../../../../../tests/docs-consistency.test.ts) asserts that every
`status` comparison in this file names `PAYMENT_SUCCEEDED`'s value and no other, and that no other production
module spells the value, which is why `activateFromDonation` compares against the constant; see
[`../../../domain/payment/AGENTS.md`](../../../domain/payment/AGENTS.md).
