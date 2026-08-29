# 8. Premium access is derived from a payment record, keyed by email

Date: 2026-07-26

## Status

Accepted for v1. Accounts and user authentication were considered and deliberately deferred: the product ships without identities, and everything below follows from that choice rather than working around it. It is not sessionless: a signed session cookie is exactly how the entitlement is carried, as the Decision describes.

## Context

There is no account system and no licence key, because [ADR 0001](./0001-planner-runs-in-the-browser.md) left the product with no users table and no identity to attach an entitlement to. The only durable record of a user is the Donation they made.

Two paths have to work: activating immediately after donating, and getting access back on a second device weeks later. The first can be verified against Stripe. The second cannot, because there is nothing to verify against except the email address itself. (The first has since split into two entry points with two different guards; the Decision below carries the current shape.)

The alternative is a magic link: email the user a signed URL on the recovery path. That is a mail round-trip, a token store and a whole failure surface, bought to protect a tier whose contents are advanced metrics and manual editing of a Suggestion.

## Decision

Premium is granted by looking up whether a succeeded payment exists for a given email address and, if so, issuing a signed 30-day session cookie. The payment record *is* the entitlement.

Activation straight after a Donation is verified against Stripe. What it verifies *with* depends on which entry point the browser arrives at, and the Context's "two paths have to work" has since become three entry points over two guards.

The two verified ones are thin wrappers over a single private `activateFromDonation` in [`activatePremium.ts`](../apps/web/src/application/use-cases/activatePremium.ts), which retrieves the payment intent, refuses anything not `succeeded`, and takes the payer's address from the intent rather than from the caller. The third reaches Stripe not at all. The extra guard is a **required** parameter of the entry point that holds it, never an optional field on a shared function:

| Entry point | Use case | Guard |
| --- | --- | --- |
| `GET /api/payment/activate` | `activateWithPayment` | `matchesClientSecret` against the secret Stripe appended to the `return_url`. It passes `expectedEmail: undefined` and therefore **cannot** reject a mismatched email |
| `POST /api/check-session` with a `premiumKey` | `activateWithClaimedPayment` | the email the browser typed must equal the intent's. It passes no client secret |
| `POST /api/check-session` with an email only | `activateWithEmail` | none: the "I already donated" recovery path |

The client secret is the stronger of the two guards, since only someone who completed the payment holds it, and it is what the straight-after-a-Donation redirect actually presents. Deriving the email from the intent rather than checking it is what lets that redirect activate at all, because the payer may return in a browser that never held their address. The recovery path is not verified: it grants access to anyone who types an address with a succeeded payment behind it.

## Consequences

- **The recovery path is only as private as the email address.** That asymmetry is the cost of having no identity to prove. It is accepted because Premium unlocks advanced metrics and manual editing, nothing that stores data, spends money, or exposes anything about the donor. Treating it as a hole to plug misreads the decision.
- **Access is never revoked from someone who has donated, by design.** There is no revocation path and none is wanted: the entitlement follows the payment, and a payment that succeeded stays succeeded. Revoking would mean deleting or altering a payment row, entangling entitlement with financial records, which is a second reason not to build it.
- The session cookie is the only server-issued credential in the product, and it governs only what leaves the browser. The client-side Premium gate is the persisted `premiumKey`, which anyone can write; see [ADR 0007](./0007-persisted-client-state-is-obfuscated-not-encrypted.md). Both are acceptable for the same reason: the tier is metrics and editing, not data or money.
- Premium expires 30 days after activation regardless of when the Donation was made, and re-activating is the same unverified lookup.
- **"Verified" is not one thing, so do not read the guard off the wrong entry point.** `GET /api/payment/activate` verifies a client secret and no email; `POST /api/check-session` with a `premiumKey` verifies an email and no client secret. Adding the missing guard to either is a behaviour change, not a hardening: the redirect path has no email to check, and the claimed-payment path has no secret to check. The shape is recorded alongside the code in [`../apps/web/src/application/use-cases/CLAUDE.md`](../apps/web/src/application/use-cases/CLAUDE.md).
