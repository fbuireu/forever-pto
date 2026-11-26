# apps/web/src/domain/payment

## Purpose

What a Donation is once Stripe has decided: the events its webhook turns into and the statuses a payment can be
in, and the one identifier the payer's browser hands back. Types, constants and one predicate, and pure like the
rest of the domain: no Effect, no `@infrastructure/*`, no Stripe type
([ADR 0023](../../../../../docs/adr/0023-the-payment-domain-is-types.md)). The layer contract is in
[`../AGENTS.md`](../AGENTS.md).

There is no accounts table: a payment row with status `succeeded` *is* Premium
([ADR 0008](../../../../../docs/adr/0008-premium-derived-from-payment.md)). Everything here is ultimately about
keeping that row honest.

## Files

| File | Contents |
| --- | --- |
| [`events/types.ts`](./events/types.ts) | `PaymentSucceededEvent` and `PaymentFailedEvent` (plain interfaces, no Stripe types) plus `PAYMENT_STATUSES`, the `PaymentStatus` union derived from it, the widened `ReportedPaymentStatus` that the events actually carry, and the `PAYMENT_SUCCEEDED` constant |
| [`paymentIntentId.ts`](./paymentIntentId.ts) | `PaymentIntentId`, a branded `string`, and `isPaymentIntentId`, the only way to make one |
| [`fixture.ts`](./fixture.ts) | `paymentIntentIdFixture(value)`: a test's `PaymentIntentId`, built through the guard and throwing when the guard refuses |

## Who builds and who reads it

| Module | Takes |
| --- | --- |
| [`provider/events.ts`](../../infrastructure/services/payments/provider/events.ts), the Stripe adapter | both event interfaces, which it builds out of a `PaymentIntent` |
| [`paymentSucceeded.ts`](../../application/use-cases/paymentSucceeded.ts) and [`paymentFailed.ts`](../../application/use-cases/paymentFailed.ts), the handler use cases | the event each one acts on |
| [`activatePremium.ts`](../../application/use-cases/activatePremium.ts) and [`confirmation.ts`](../../infrastructure/services/payments/confirmation.ts) | `PAYMENT_SUCCEEDED`, the one value each compares an intent's status with |
| [`repository.ts`](../../infrastructure/services/payments/repository.ts) | `ReportedPaymentStatus`, the type of the status it writes |
| [`@application/dto/payment`](../../application/dto/AGENTS.md) `rules.ts` and `types.ts` | the statuses, the constant and the widened type |

`processWebhookEvent` builds an event through the adapter and hands it to one handler per branch; the handlers'
invariants are in [`../../application/use-cases/AGENTS.md`](../../application/use-cases/AGENTS.md), the adapter's in
[`../../infrastructure/services/payments/AGENTS.md`](../../infrastructure/services/payments/AGENTS.md).

## `PaymentIntentId` marks an id this app has read, not one Stripe supplied

`PaymentIntentId` is `string & { readonly [paymentIntentIdBrand]: true }`: a plain string at run time, so the wire,
the JWT claim and the `payments.id` column are unchanged. The one way to make it is `isPaymentIntentId`, which
accepts `pi_` and Stripe's alphanumeric tail and nothing else. The tail holds no underscore, which is what keeps
a client secret (`pi_…_secret_…`, which starts with the id it belongs to) from passing for an id. No cast makes
one, in a test either: `paymentIntentIdFixture` narrows through the guard.

**It enters at the three places the payer's browser names an intent**, through `paymentIntentIdSchema` in
[`@application/dto/payment/schema`](../../application/dto/payment/schema.ts), which wraps the guard so the app layer
reaches it without importing the domain: the `payment_intent` of `GET /api/payment/activate`, the `premiumKey` of
`POST /api/check-session`, and the `payment_intent` of the confirmation page. What it fails with is a
`ValidationError` carrying `invalid_payment_reference`, the code the API already answers a reference Stripe refuses
with, so a malformed id reads as it did before and no longer costs a Stripe round trip. What takes one is what
hands an id to Stripe: `paymentIntents.retrieve`, `confirmation`, `activateWithPayment` and
`activateWithClaimedPayment`.

**What Stripe or the database supplies stays a `string`, on purpose.** The events' `paymentId`, `NewPayment.id`
and `PaymentData.id`, the JWT's `paymentIntentId` claim and the client's `premiumKey` are not narrowed: a branded
id built from them would need a check with no honest failure to return (Stripe does not send a malformed id), or
would refuse a stored row an older deploy wrote, which `PaymentData.status` already refuses to guess at. The brand
therefore says *the caller proved the shape before this reached Stripe*, and a value read back from our own
tables is not asked to.

## An event carries what a handler acts on, not a copy of the intent

`PaymentSucceededEvent` is `paymentId`, `email`, `status` and `latestChargeId`. `handlePaymentSucceeded` reads
all but `email`, which `processWebhookEvent` reads to write the row: `email` stays because the adapter's
`MissingDonorEmailError` guard is what proves it resolved, and a caller must not have to re-derive that.

Everything else the intent holds stays with the intent. `processWebhookEvent` passes the intent itself to
`paymentDataDTO.create` as `raw`, which reads `raw.amount` and keeps Stripe's minor units, and reads the promo
code, the user agent and the IP address through `readDonationMetadata` beside it. No event carries a `type`
either: `processWebhookEvent` switches on Stripe's own discriminated union and calls one handler per branch.

`PaymentFailedEvent.errorMessage` exists for the log: `handlePaymentFailed`'s warn carries it as `reason`, and
that line is its only reader.

## The entitlement value is typed where it can be proved, and named where it cannot

`PAYMENT_STATUSES` restates Stripe's `PaymentIntent.Status` members by hand, and `PaymentStatus` is derived
from it: the list is not imported from the SDK, because the domain names no Stripe type. It is the set of
statuses **this product reasons about**, which is not the same claim as the set Stripe can send.

**Stripe's enums are open, so what an event carries is `ReportedPaymentStatus`, not `PaymentStatus`.** Stripe
adds members to an enum on an API version already pinned, and the SDK's types say so: `PaymentIntent.Status`
ends in its `OtherString` marker. `ReportedPaymentStatus` is the union widened the same way, so a status this
product has never modelled reaches the database exactly as Stripe sent it rather than being dropped, renamed to
a sentinel, or turned into a failed webhook that Stripe then retries forever. Every consumer asks *is it
succeeded* and never *which of the seven is it*, so none of them needs the closed union to be correct. The
adapter assigns Stripe's own `status` to it with no cast, which is how the event interfaces stay free of Stripe.

`tests/docs-consistency.test.ts` compares `PAYMENT_STATUSES` against the `type Status` union the installed SDK
publishes, so a member Stripe adds fails the suite whether or not any code assigns it. `updatePaymentStatus`'s
`status` takes the same widened type.

**`PaymentData.status` deliberately stays `string`, and the union would be a lie there.** Its
producers are: `paymentDataDTO`, which reads a `Stripe.PaymentIntent`, and `toPaymentData` in
[`@infrastructure/services/payments/repository`](../../infrastructure/services/payments/AGENTS.md), which
reads a SQLite `TEXT` column. Nothing constrains what that column holds (an older deploy, a manual fix), so
narrowing the field would need an `as` at the read, which buys a claim the code cannot check in exchange for
nothing: no consumer switches on the status, they all test it against one value.

That is what `PAYMENT_SUCCEEDED` is for. It is redundant where the union already applies, and it is the
spelling to reach for wherever a `PaymentData.status` meets the entitlement value. **No handler compares
against it**: the `WHERE` clause owns that rule, see the use cases' guide. Its readers are all outside this
folder, `activatePremium`'s guard on a raw `Stripe.PaymentIntent.status` among them, and the contract suite lets no
production module spell the literal instead, the repository's SQL and two modules that use the word for something
else aside.

**`PaymentConfirmationDTO.status` is widened like the events, and the page does not read it.** Which
statuses mean *charged* is a business rule, and `app` never imports `domain`, so
[`@application/dto/payment/rules`](../../application/dto/payment/rules.ts) owns it: `hasSucceeded` and
`wasCharged` are what the confirmation page calls, and the set of not-charged statuses lives beside them.

**Copies of the literal remain, all inside SQL, and none of them can take the constant.**
`repository.ts` spells `'succeeded'` in the `succeeded_at` `CASE`, in `updatePaymentStatus`'s guard, in
`getSucceededPaymentByEmail`'s `WHERE` and in `countPromoCodeRedemptions`'. Interpolating a TypeScript value into
a query string to remove them would trade a checkable drift for something that reads as injection.
`tests/docs-consistency.test.ts` ties every status comparison in that file to `PAYMENT_SUCCEEDED` instead, and
`repository.test.ts` asserts the `CASE`.

## Out of scope

| Concern | Where it lives |
| --- | --- |
| Building an event out of a Stripe `PaymentIntent` | [`provider/events.ts`](../../infrastructure/services/payments/provider/events.ts) |
| Reconciling the payments table with an event | the handler use cases, [`paymentSucceeded.ts`](../../application/use-cases/paymentSucceeded.ts) and [`paymentFailed.ts`](../../application/use-cases/paymentFailed.ts) |
| Webhook signature verification and event dispatch | the route handler under `src/app/api/`, then `webhook.ts` |
| Creating a missing payment row from the webhook | `webhook.ts` |
| Granting Premium and minting the session | `activatePremium.ts` and `@infrastructure/services/premium` |
| Creating the intent, promo codes, rate limiting | `@infrastructure/services/payments` |
| Anything the payer sees | `@ui/adapters/payments` and the payment pages |

## Testing

[`paymentIntentId.test.ts`](./paymentIntentId.test.ts) walks the guard over a client secret, a charge id and the
inputs a query string or a body can hand it, and the fixture over the one it refuses.

`events/types.ts` has no test of its own: it holds types and two constants, and nothing in it runs.
`PAYMENT_STATUSES` is read by the contract suite against the installed SDK and by
[`rules.test.ts`](../../application/dto/payment/rules.test.ts), which walks every status through `hasSucceeded`
and `wasCharged`; `PAYMENT_SUCCEEDED` is pinned against the repository's SQL by `repository.test.ts`.
