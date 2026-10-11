# 23. The payment domain is types; its handlers are use cases and its factory is an adapter

Date: 2026-10-11

## Status

Accepted. Supersedes the payment half of
[ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md); its calendar half stands.

## Context

Across this repository and its siblings, Effect has one place per layer:

- **infrastructure declares**: the service tags, the live layers, the tagged errors and the wrapping of every vendor
  call;
- **application composes**: a use case is an Effect program that asks for services by tag;
- **the edge runs them**: a route handler or a server action provides the layers and terminates the program;
- **the domain is pure**: no Effect and no infrastructure.

`apps/web/src/domain/payment` broke the last rule, and [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md)
sanctioned it. Read against the four lines above, the folder held three different things:

- The two handlers, `paymentSucceeded.ts` and `paymentFailed.ts` under `handlers/`, imported `effect`, the Turso and
  Stripe service tags, `LoggerService`, `retrieveCharge` and the payments repository. They orchestrated services,
  which is a use case's job, and `processWebhookEvent`, the use case that called them, already lived one layer up.
- The factory, `events.ts` and `resolvers.ts` under `events/factory/`, turned a Stripe `PaymentIntent` into the app's
  own event, reading Stripe's types and `readDonationMetadata`. That is an adapter's job, and the payments service
  already kept its Stripe readers, `charge.ts` and `metadata.ts`, under `provider/`.
- `events/types.ts` held the events and the payment statuses. Only that file was domain.

ADR 0003 weighed one uniform alternative, holding the payment context to purity by extracting repository interfaces
into the domain, and rejected it because the service tags already are the interfaces: a second set would have one
implementation each and buy no substitution the tests do not already have. That argument is right, and it is not an
argument for keeping the programs in the domain. Moving them up a layer keeps the tags as the interfaces and adds
nothing.

What the exception cost was paid in reading. A reader who knows the sibling repositories reads `domain/` as pure, and
here had to learn that one of its two contexts was not: two ADRs, three guides and two wiki pages explained rival
rules inside one layer, the contract suite let Stripe into `payment/` as `import type` in one folder, and the counted
layer graph carried a `domain → infrastructure` edge that nothing in the calendar context needed.

## Decision

**The domain is pure, both contexts alike.** Nothing under `apps/web/src/domain` imports `effect`,
`@infrastructure/*` or a vendor SDK (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`,
`@tursodatabase/serverless`, `resend`, `@opennextjs/cloudflare`), and a type-only import counts.
[`tests/docs-consistency.test.ts`](../../tests/docs-consistency.test.ts) holds every file under `domain/`, its tests
included, to that rule, with no carve-out for `payment/`.

**`domain/payment/` is types.** [`events/types.ts`](../../apps/web/src/domain/payment/events/types.ts) keeps
`PaymentSucceededEvent`, `PaymentFailedEvent`, `PAYMENT_STATUSES`, `PaymentStatus`, `ReportedPaymentStatus` and
`PAYMENT_SUCCEEDED`. The event interfaces never named a Stripe type: `status` is `ReportedPaymentStatus`, the domain's
own mirror of Stripe's open status enum, so no reference had to move out with the factory.

**The handlers are use cases.** `handlePaymentSucceeded` and `handlePaymentFailed` live in
[`paymentSucceeded.ts`](../../apps/web/src/application/use-cases/paymentSucceeded.ts) and
[`paymentFailed.ts`](../../apps/web/src/application/use-cases/paymentFailed.ts) under `application/use-cases/`, in the
shape every use case there has: an `Effect.gen` with its `Effect.Effect<A, E, R>` written out, ending in
`Effect.withSpan` named after the export. Their names, signatures, error channels and behaviour are the ones they had,
and `processWebhookEvent` still builds the event and calls one per branch.

**The factory is an adapter.** `createPaymentSucceededEvent`, `createPaymentFailedEvent` and `resolveChargeId` live
in [`provider/events.ts`](../../apps/web/src/infrastructure/services/payments/provider/events.ts) and
[`provider/resolvers.ts`](../../apps/web/src/infrastructure/services/payments/provider/resolvers.ts), beside the other
two readers of a Stripe object. Stripe's types stop there, in the layer that wraps every vendor call.

**Still rejected: repository interfaces in the domain.** A use case composes directly against the tags and the
programs under `infrastructure/services`; that half of ADR 0003's argument is this decision's too.

## Consequences

- **The contract suite's domain rule is load-bearing.** It fails on an `effect` import, an `@infrastructure/` path and
  a vendor SDK anywhere under `domain/`, `import type` and a type-position `import()` included; without it, a
  type-only `import type Stripe` is the first thing to creep back, since it compiles and bundles nothing.
- **The counted graph changes shape.** `domain → infrastructure` disappears, and `infrastructure → domain` gains the
  adapter's type import of the events. `domain` imports upward once, `domain → application`, which is
  [ADR 0012](./0012-shared-date-helpers-stay-in-the-application-layer.md)'s.
- **The payment context is read across three folders.** The types are in `domain/payment/`, the Stripe reading in
  `infrastructure/services/payments/provider/` and the programs in `application/use-cases/`; following one webhook
  means opening `webhook.ts`, the adapter and a handler. The invariants the handlers keep (no read before a write, the
  `WHERE` guard, charge enrichment that never fails the webhook) moved with them into the use cases' guide.
- **Two use cases are called by another use case, not by the edge.** `processWebhookEvent` is the only caller of both
  handlers, and the Stripe webhook route terminates it; their `Effect.withSpan` nests under its own.
- **The rules move with the code.** In [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md), the return-type rule for
  `domain/payment` merges into `A3` for the handlers and `I16` for the adapter, and the rule to compose against the
  tags directly is `A19`. The guides of `domain/`, `domain/payment/`, `application/use-cases/` and
  `infrastructure/services/payments/` and the wiki's architecture pages describe the new homes.
