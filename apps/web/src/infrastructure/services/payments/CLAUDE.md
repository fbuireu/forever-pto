# apps/web/src/infrastructure/services/payments

## Purpose

Every Stripe call and every SQL statement behind a Donation. Nothing here decides a flow: each export is an
Effect *program* composed against `StripeServerService`, `TursoService` or `LoggerService`, and something
else (a use-case, a webhook handler, a route) provides `ApplicationLayer` and runs it
([ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md)).

The payments table is also the entitlement store. A succeeded row *is* Premium
([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)), which is why [`repository.ts`](./repository.ts) is
read by the premium activation path as well as by the payment one.

## Files

| File | Exports | Requires |
| --- | --- | --- |
| `repository.ts` | `savePayment`, `updatePaymentStatus`, `updatePaymentCharge`, `getPaymentById`, `getSucceededPaymentByEmail`, `countPromoCodeRedemptions`, the `PaymentChargeData` shape | `TursoService` |
| [`normalizeEmail.ts`](./normalizeEmail.ts) | `normalizeEmail(email)`: trim and lower-case, applied on both sides of every address comparison | None |
| [`normalForms.ts`](./normalForms.ts) | `PAYMENT_CURRENCY` and `normalizePromoCode(code)`: the two forms every payment value has to be written in, at every site that writes one | None |
| [`confirmation.ts`](./confirmation.ts) | `confirmation(paymentIntentId)`: a `PaymentConfirmationDTO`, or `null` on any failure; warns through the tag when the intent is not `succeeded`, so the page renders and never logs | `StripeServerService`, `LoggerService` |
| [`rateLimit.ts`](./rateLimit.ts) | `checkRateLimit(ip)`: fails with `RateLimitError` | the Cloudflare `PAYMENT_RATE_LIMITER` binding |
| [`provider/intent.ts`](./provider/intent.ts) | `createPaymentIntent(params)`: the Stripe intent behind a Donation | `StripeServerService` |
| [`provider/metadata.ts`](./provider/metadata.ts) | `readDonationMetadata(intent)` and `clampMetadata(value)`: the two halves of the donation metadata format | None |
| [`provider/charge.ts`](./provider/charge.ts) | `retrieveCharge(chargeId)`: normalises a Stripe `Charge` into flat, nullable fields | `StripeServerService` |
| [`provider/promoCode.ts`](./provider/promoCode.ts) | `validatePromoCode(code, amount)`: a `DiscountInfo`, or a `PromoCodeError` | `StripeServerService`, `TursoService` |

`provider/` is the Stripe side; at the root sit the database, the rate limiter and the address normaliser, and
`confirmation.ts` sits between: a Stripe read that exists only to render the post-checkout page.

## Who calls what

| Caller | Uses |
| --- | --- |
| `payment.ts` (use-case) | `validatePromoCode`, `createPaymentIntent`, `savePayment` (deferred) |
| `activatePremium.ts` (use-case) | `getSucceededPaymentByEmail`, `savePayment`, `updatePaymentStatus` |
| [`webhook.ts`](../../../application/use-cases/webhook.ts) (use-case) | `getPaymentById`, `savePayment` |
| [`paymentSucceeded.ts`](../../../domain/payment/handlers/paymentSucceeded.ts) / [`paymentFailed.ts`](../../../domain/payment/handlers/paymentFailed.ts) (domain handlers) | `updatePaymentStatus`, `updatePaymentCharge`, `retrieveCharge` |
| [`api/operations/payment.ts`](../../api/operations/payment.ts) and [`api/operations/activatePremium.ts`](../../api/operations/activatePremium.ts) | `checkRateLimit` |
| The confirmation page | `confirmation` |

The domain handlers importing infrastructure directly is the deliberate asymmetry in
[ADR 0003](../../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md); see
[`../../../domain/payment/CLAUDE.md`](../../../domain/payment/CLAUDE.md).

## Invariants

**`checkRateLimit` has no caller outside `api/operations/`, and which endpoints that covers is the API
guide's to state.** Both operations that reach it (`createPaymentRequest` and `activatePremiumRequest`)
yield it first, before the request body is even read, and every transport over them inherits the limit
whether it asks for one or not. That is the property this folder owns; the endpoint list belongs to
[`../../api/CLAUDE.md`](../../api/CLAUDE.md), and this file kept a second copy of it that had gone stale:
it still said the `POST /api/check-session` half of session activation was unlimited, which stopped being
true when the limiter moved into `activatePremiumRequest`.

**`savePayment` is idempotent by SQL, not by check.** `INSERT OR IGNORE` on the primary key is what lets
the webhook re-create a row the deferred write may have lost, and lets the donation activation path write
one for a Donation the webhook has not caught up with yet. Nothing reads before writing, and nothing merges: a
second insert for the same intent is dropped whole, including any column the first one left null.

**`updatePaymentStatus` is guarded the same way, and both answer whether they wrote.** Its `WHERE` carries
`AND status != 'succeeded'`, so a succeeded row, the entitlement, cannot be overwritten by a late or
redelivered event, and both functions return a `boolean` off `rowsAffected`. That is what removed the
read-compare-write those callers each spelled out: `getPaymentById(...)` absorbed to `undefined`, a
comparison against `PAYMENT_SUCCEEDED`, then the write, written four times over. It was never a real guard
anyway: `TursoService` opens a connection per call, so nothing spanned the read and the write, and two
webhook deliveries could both read `processing` and both write. The rule is now one predicate the database
evaluates atomically.

Every caller lost its read. `handlePaymentFailed` writes and warns when nothing was touched;
`processWebhookEvent` inserts unconditionally and logs a creation only when the insert reports one, which
also fixed a lie, since the old read-then-insert could be beaten to the row and still claim it had created
it; and the donation activation path's deferred is now insert-or-ignore followed by the guarded update, correct
whether or not the row was already there. **`handlePaymentSucceeded` was the last to keep one**, on the
grounds that 0 rows cannot tell "already succeeded" from "no such row". It cannot, and the handler no longer
needs to: `savePayment` runs immediately before it in `processWebhookEvent`, so "no such row" was
unreachable and the read only ever answered it when the read itself had failed, laundering an unreachable
database into a 200 Stripe would never retry. See
[`../../../domain/payment/CLAUDE.md`](../../../domain/payment/CLAUDE.md).

**Amounts are in Stripe minor units everywhere except `confirmation.ts`.** `createPaymentIntent` multiplies
by 100 on the way in, `paymentDataDTO` keeps minor units for the table, and `confirmation` divides by 100
because its output feeds a screen. Two payment shapes with an `amount` field, two different units.

**The currency is `PAYMENT_CURRENCY` from [`normalForms.ts`](./normalForms.ts)**, imported by `createPaymentIntent` (which
prices the intent) and by `provider/promoCode.ts`, which refuses to compare a promotion-code minimum
priced in anything else. They were two separate literals with a sentence here saying they had to move
together, and nothing enforcing it; one import each is what makes that sentence a compile-time fact.

`normalizePromoCode` sits beside it for the same reason. It was exported from `repository.ts` with
`repository.ts` as its only importer, while `provider/promoCode.ts` re-spelled it as
`code.toUpperCase().trim()`, the same two operations in the opposite order. The order is not observable
(no character uppercases into or out of whitespace, so the two compose commutatively over every input), but
the duplication is: the code sent to Stripe's `promotionCodes.list` and the code the redemption count is
keyed by have to be the same string, and only one of them was reading a shared definition.

`PAYMENT_CURRENCY` guards **two** places in that file and both are load-bearing. The promotion-code
`minimum_amount` in another currency is *ignored*: the restriction cannot be evaluated, so it is not
applied. A coupon's own `amount_off` in another currency is *refused* with `COUPON_INVALID`, because
`calculateFinalAmount` subtracts `amount_off / 100` as though it were euros: a $200 discount would come off
a €10 Donation as €2 at whatever the rate happened not to be. Percentage coupons are untouched by either
check; a percentage has no currency to disagree about. A coupon carrying `amount_off` with no `currency`
at all is refused too, since there is nothing to compare.

**The name carries the filter, because the filter is in the `WHERE` and nothing else could see it.** It was
`getPaymentByEmail`, whose signature promised "the payment for this address" while its SQL also required
`status = 'succeeded'`, so `activateWithEmail` wrote that predicate a second time as a TypeScript `if`, over
a row the query cannot return. The dead branch had a passing test: it mocked
`{ id: 'pi_found', status: 'processing' }`, a shape that function does not produce, which is the failure this
folder already confesses to for the promotion-code case: a mock built from the same reading as the code
proves nothing, and here it disagreed with the repository's own SQL and still went green. The `ORDER BY
stripe_created_at DESC LIMIT 1` beside it is only meaningful once "succeeded" is part of the question, which
is the other reason the filter belongs in the name rather than at the caller.

**The payer's address is compared normalised, never raw.** `normalizeEmail.ts` trims and lower-cases, and
it is applied on both sides of every comparison: `getSucceededPaymentByEmail` matches `lower(trim(email))` against a
normalised parameter, and `activateWithClaimedPayment` normalises the intent's address and the caller's
before testing them for equality. Email is the only key Premium can be recovered by
([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)), and SQLite's `=` on `TEXT` is
case-sensitive, so a payer who typed `Name@Example.com` at checkout and `name@example.com` on the way back
was refused access they had paid for. The `lower(trim(...))` on the **column** is what makes rows written
before this normalisation still match; it forgoes an index on `email`, which is the accepted cost for a
table of this size. Do not "optimise" it back to a bare `email = ?` without first migrating the stored
values.

**Every field the entitlement later depends on travels in the intent's `metadata`.** Both donation entry
points read the payer address from `metadata.email`, and `paymentDataDTO` reads `promoCode`, `userAgent` and `ipAddress` from there.
Stripe metadata values must be strings, which is why the builder is full of `?? ''` and `.toFixed(2)`; a
value dropped here cannot be recovered from Stripe afterwards.

**`provider/metadata.ts` is both halves of that format, and it exists because they had drifted.**
`createPaymentIntent` is the only writer of the donation metadata block, and the read was open-coded twice:
in `@domain/payment`'s event factory and in the donation activation path. They did not agree. The factory
took the first non-blank of `metadata.email` and `receipt_email` after trimming; the activation path used
`??` alone, which accepts the empty string Stripe allows. So an intent carrying `metadata.email = '   '` and a
valid `receipt_email` had the webhook record the row correctly while the redirect path refused it with
`'Email mismatch'` and sent the payer to `activation=failed`, for a Donation that had cleared. Both callers
now read through `readDonationMetadata`, and `clampMetadata` moved beside it. The reader returns
`email: string | undefined` rather than failing, because the two callers owe different errors:
`MissingDonorEmailError` in the factory, `ValidationError` at the use-case.

**Stripe caps a metadata value at 500 characters, and three of ours were unbounded.** `promoCode`,
`userAgent` and `ipAddress` now go through `clampMetadata`. A `User-Agent` over the cap is trivially
forgeable and occurs in the wild from AV- and enterprise-injected headers, and it made `paymentIntents.create`
reject the whole call, so a header the donor never chose failed the Donation, and the route answered a bare
500. `promoCode` reaches the same place unvalidated whenever it is whitespace: `createPayment` guards with
`if (validated.promoCode?.trim())`, so `'   '` skips `validatePromoCode` and is written verbatim.

**`email` is deliberately *not* clamped, and must not be.** It is the only key Premium can ever be recovered
by ([ADR 0008](../../../../../../adr/0008-premium-derived-from-payment.md)) and `activateWithClaimedPayment`
matches on it exactly, so a truncated address would silently orphan the payer, the same class of failure as writing
a blank one. An over-long address is refused earlier instead, by the `.max(254)` on
`createPaymentSchemaWithMessages`, so it fails as a `ValidationError` and a 400 rather than reaching Stripe.
`promoCode` carries a `.max()` there too, which is what stops the whitespace bypass carrying an arbitrarily
long string. Adding a new free-text metadata field means deciding which of these two it is.

Both of those `.max()` rules carry a message key, and the promo-code one did not at first. A Zod rule
without `{ message }` falls back to Zod's own English prose, and that string is what `zodParse` puts into
`ValidationError` and what `/api/payment` returns as the 400 body's `error`, so a Catalan or German donor
was shown "Too big: expected string to have <=100 characters", in the form and from the API alike. The rule
now names `messages.promoCodeTooLong`, pre-bound to the machine code `promo_code_too_long` for the server
and resolved through `validation.payment.promoCodeTooLong` for the form; `checkout.errors.promo_code_too_long`
is its lookup in all six bundles. See [`../../../application/dto/CLAUDE.md`](../../../application/dto/CLAUDE.md).

## Traps

**A payment is written with `NewPayment` and read back as `PaymentData`, and the two are different
widths.** `PaymentData` is the stored record: 28 fields, one per column. `NewPayment` is the thirteen the
`PaymentIntent` actually knows, and `paymentDataDTO` produces that. The DTO used to produce all 28 by
hardcoding `null` for the other fifteen, which read as "we checked and there is nothing there" when it meant
"this is not knowable yet": twelve of them are filled minutes later by `updatePaymentCharge` off the expanded
charge, and the last four (the refund, dispute, parent and origin columns) have no writer anywhere in this
codebase.

**The `INSERT` still names all 29 columns and binds a literal `null` to the fifteen, and that is
deliberate.** Omitting a column is not the same statement: a `NOT NULL` column with a `DEFAULT` takes the
default when omitted and rejects an explicit `NULL`. The schema lives in Turso, not in this repo, so nothing
here can prove which columns those are. Binding `null` is what the code already did, byte for byte, and the
narrowing is a type change only. Trimming the column list is a separate change that needs the real schema in
front of you.

The fixture in [`repository.test.ts`](./repository.test.ts) had been lying about this in a way the suite could not catch. It passed
`savePayment` a fully populated 28-field object including `country: 'ES'` and `paymentBrand: 'visa'`, and the
by-column assertion duly confirmed they arrived, for values no production caller has ever sent, because the
only producer wrote `null`. It is `NewPayment` now, and the read tests get their own `BASE_STORED_PAYMENT`.

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
outside a request, so what confines this file to a request is the `cf-connecting-ip` header it keys on, not
the context call ([ADR 0004](../../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**It counts on the platform, because a KV counter cannot be made correct here.** This was a read-modify-write
over `RATE_LIMIT_KV` (`get`, compare, `put(count + 1)`) and Workers KV offers neither compare-and-swap nor
atomic increment, so every request whose `get` resolved before a peer's `put` landed read the same value and
wrote the same number. The 10-per-60 s bound therefore held only for strictly serialised traffic: two hundred
parallel `POST /api/payment` from one IP, which is exactly the shape of card-testing traffic, advanced the
counter by an amount unrelated to the burst and admitted almost all of them to
`stripe.paymentIntents.create`. Two KV properties widened the window rather than narrowing it: a `get` is
served from a per-colo cache whose minimum TTL is 60 s, the same as the window, and writes to one key are
throttled to roughly one per second. `simple = { limit = 10, period = 60 }` in `wrangler.toml` now owns both
bounds (`period` accepts only 10 or 60), so there is no `LIMIT`, no `WINDOW_SECONDS` and no `rl:payment:`
key in this file. This is distinct from the fail-open stance above, which covers errors only, and from the
"best-effort, not atomic" caveat granted to the promo-code cap below: that one is a marketing control, this
one is the only thing in front of the card processor.

**A promotion code carries its coupon under `promotion`, not at the top level, and reading the wrong one
broke every promo code in production.** On the `dahlia` API version this repo pins, `PromotionCode` has
`promotion: { type: 'coupon', coupon: string | Coupon | null }` and **no** `coupon` field of its own.
`validatePromoCode` read `promotionCode.coupon` through an `as unknown as { coupon: Stripe.Coupon }` cast (which is exactly
what stopped the compiler saying so), got `undefined`, and failed every single valid code
with `FAILED_TO_LOAD`. Nothing caught it: the co-located test built its mock in the shape the code expected
rather than the shape Stripe sends, so the suite agreed with the bug. Verified against the real test account
by creating codes and running the program over them; with the old read, seven of nine live cases returned
`failed_to_load`, and the only two that passed were the ones that never reach a coupon at all.

The coupon is a bare id unless asked for, so `list` now carries `expand: ['data.promotion.coupon']` and the
second `retrieve` call is gone: one round trip, not two. That expansion is the load-bearing part: without
it `promotion.coupon` is a string and the guard refuses it. `expand: ['coupon']`, the old path, is not
rejected by the API; it is simply ignored, which is why the failure was silent.

**Promotion-code checks come before coupon checks, and the first error wins.** `validatePromoCode` resolves
the code, then evaluates the promotion code (active, expiry, redemptions, minimum amount)
and only then the coupon (valid, redemptions, `redeem_by`). A code failing both reports the promotion-code
reason. The `PromoCodeErrorCode` returned is a translation key the UI looks up, not a message.

**Two branches here are unreachable through this path, and both are deliberate.** `list` is called with
`active: true`, which the API honours by hiding deactivated codes entirely, so a code the operator switched
off comes back as an empty list and reports `INVALID_OR_EXPIRED` from the length check, never from the
`promotionCode.active === false` test below it. And Stripe refuses to *create* a coupon whose `redeem_by` or
a code whose `expires_at` is already in the past, so those two comparisons can only fire on an object that
aged into expiry. Keep them: they are the only thing standing between a stale object and a discount.

**Discounted amounts are rounded to whole cents where they are computed.** `amount * (1 - percent_off / 100)`
is binary floating point (a 90% code on €10 yields `0.9999999999999998`), and while `createPaymentIntent`'s
own `Math.round(amount * 100)` charges the right number of cents regardless, `MIN_FINAL_AMOUNT` compares the
unrounded value. A 90% code on a €5 Donation computes `0.4999999999999999` and was refused with
`MIN_AMOUNT_EXCEEDED` for a result that is exactly the €0.50 floor. `calculateFinalAmount` rounds to cents
before returning, so the floor comparison and the figure shown to the donor both see the real amount.

**The redemption cap is counted from our own table, because Stripe never learns the code was used.** A
promotion code is redeemed by a Checkout Session, an Invoice or a Subscription; this app computes the
discount locally and sends a bare `paymentIntents.create` with the amount already reduced, so
`times_redeemed` stays 0 forever and the `max_redemptions` branch in `getPromotionCodeValidationError` can
never fire on its own. A single-use 90%-off code was therefore permanent for anyone who learned it.
`validatePromoCode` now counts succeeded rows in `payments` whose `promo_code` matches (normalised on both
sides, since the column holds what the user typed while Stripe is queried with the upper-cased form), and
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
confirmation page cannot distinguish "Stripe is down" from "no such intent". That is intentional (the money
has already moved by then and the page is a receipt, not a gate), but it means a broken Stripe key shows up
only in the logs.

## Testing

Every file has a co-located `.test.ts`, all built the same way: `Layer.succeed(Tag, mock)` for each tag in
`R`, a local `run` helper that provides the merged layer, and `Effect.flip` where the assertion is about the
failure. [`rateLimit.test.ts`](./rateLimit.test.ts) mocks `@opennextjs/cloudflare` instead, since the rate-limiting binding is its only
dependency; its burst case drives 200 concurrent `checkRateLimit` calls to pin that the count is the
platform’s and not a local read-modify-write.

**No fixture may be shaped like a real Stripe client secret.** Secret scanners match `pi_<id>_secret_<rest>`
and cannot tell a test double from a leak, so a fake in that shape fails the scan on every push and trains
everyone to wave the alert through. The fixtures read `fixture-client-secret` and `client-secret-abc`
instead. **The pair in `activatePremium.test.ts` is deliberately the same length**
(`fixture-client-secret` and `fixture-client-WRONGx`, both 21) because `matchesClientSecret` short-circuits
on length, so an unequal pair would exercise the guard rather than the constant-time comparison the test is
there for.

No test constructs a Stripe or Turso client, and that is exactly how the promotion-code shape above went
unnoticed for as long as it did. A mock is written from the same reading of the API the code was written
from, so when the reading is wrong the mock agrees with it and the suite proves nothing. Where a shape
matters, build the fixture from a response the real account actually returned, and say in the test what
about it is load-bearing: [`promoCode.test.ts`](./provider/promoCode.test.ts) now nests the coupon under `promotion` and carries a case
asserting the code never reaches for a top-level `coupon`.

**`repository.test.ts` reads the column order out of the SQL and asserts against that, rather than against
literal indices.** `insertedColumns` slices the `INSERT`'s own column list, `updatedColumns` matches the
`SET x = ?` assignments and appends the `WHERE id` key, and `boundRow` zips either list against the argument
array, so the expectation is a named row, `{ email: 'user@example.com', … }`, and a column inserted mid-list
shifts every name-value pair below it and fails loudly. It also ties the two counts nothing used to compare:
`sql.split('?')` against `args.length + 1`, so a placeholder added without its value, or the reverse, is
caught on its own.

That replaced seven positional spot checks over a 29-column insert. They covered indices 0 and 4–7 and left
everything from `payment_method_type` through `origin` unasserted (which is precisely the stretch a mid-list
insertion shifts), and `updatePaymentCharge` asserted only its first and last argument over a thirteen-field
payload whose middle is entirely nullable strings and numbers, where a one-place shift is type-clean. Both
falsifications were run: swapping two column names in the `INSERT`, and dropping one placeholder along with
its value.

`updatePaymentStatus`'s test also pins the SQL's `WHEN ? = 'succeeded'` against `PAYMENT_SUCCEEDED`.

**That sentence used to end "that literal is the one copy of the entitlement value the type system cannot
reach", and the count was wrong.** [`repository.ts`](./repository.ts) writes it four times, not once:
`CASE WHEN ? = 'succeeded'` and `WHERE id = ? AND status != 'succeeded'` inside `updatePaymentStatus`,
`AND status = 'succeeded'` in `getSucceededPaymentByEmail`, and `AND status = 'succeeded'` in
`countPromoCodeRedemptions`. One of the four is pinned here; the other three had nothing, and the third of
them is the query that decides whether a returning donor recovers Premium at all.

They are not consolidated, and that is the decision rather than the backlog. Stripe owns the value, so
nothing in this tree can produce a divergent one and the illegal state is not reachable from any code path:
it is a guard, not a defect. Binding the constant as a fourth parameter in four statements would couple this
SQL to a word Stripe cannot change and pay for it in statements that read less like the SQL they are.
[`tests/docs-consistency.test.ts`](../../../../../../tests/docs-consistency.test.ts) asserts instead that every
`status` comparison in this file names `PAYMENT_SUCCEEDED`'s value and no other, with a floor of four so a
rewritten statement the pattern stops matching fails the rule rather than emptying it. Verified by misspelling
one predicate.

The same rule's second half is why `activateFromDonation`, the private helper `activateWithPayment` and
`activateWithClaimedPayment` both delegate to, compares `paymentIntent.status !== PAYMENT_SUCCEEDED` rather
than against a literal. It already imported the constant and passed it to `updatePaymentStatus` further down
its own body, while the comparison that decides whether the Donation counts at all was a bare string: one
rule, one function, two spellings. No production module that imports the constant may also spell the value.
See
[`../../../domain/payment/CLAUDE.md`](../../../domain/payment/CLAUDE.md).
