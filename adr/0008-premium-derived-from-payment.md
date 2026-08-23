# 8. Premium access is derived from a payment record, keyed by email

Date: 2026-07-26

## Status

Accepted for v1. Accounts and user authentication were considered and deliberately deferred: the product ships without identities, and everything below follows from that choice rather than working around it. It is not sessionless: a signed session cookie is exactly how the entitlement is carried, as the Decision describes.

## Context

There is no account system and no licence key, because [ADR 0001](./0001-planner-runs-in-the-browser.md) left the product with no users table and no identity to attach an entitlement to. The only durable record of a user is the Donation they made.

Two paths have to work: activating immediately after donating, and getting access back on a second device weeks later. The first can be verified against Stripe. The second cannot, because there is nothing to verify against except the email address itself.

The alternative is a magic link: email the user a signed URL on the recovery path. That is a mail round-trip, a token store and a whole failure surface, bought to protect a tier whose contents are advanced metrics and manual editing of a Suggestion.

## Decision

Premium is granted by looking up whether a succeeded payment exists for a given email address and, if so, issuing a signed 30-day session cookie. The payment record *is* the entitlement.

Activation straight after a Donation is verified: it checks the payment intent with Stripe and rejects a mismatched email. The "I already donated" recovery path is not verified: it grants access to anyone who types an address with a succeeded payment behind it.

## Consequences

- **The recovery path is only as private as the email address.** That asymmetry is the cost of having no identity to prove. It is accepted because Premium unlocks advanced metrics and manual editing, nothing that stores data, spends money, or exposes anything about the donor. Treating it as a hole to plug misreads the decision.
- **Access is never revoked from someone who has donated, by design.** There is no revocation path and none is wanted: the entitlement follows the payment, and a payment that succeeded stays succeeded. Revoking would mean deleting or altering a payment row, entangling entitlement with financial records, which is a second reason not to build it.
- The session cookie is the only server-issued credential in the product, and it governs only what leaves the browser. The client-side Premium gate is the persisted `premiumKey`, which anyone can write; see [ADR 0007](./0007-persisted-client-state-is-obfuscated-not-encrypted.md). Both are acceptable for the same reason: the tier is metrics and editing, not data or money.
- Premium expires 30 days after activation regardless of when the Donation was made, and re-activating is the same unverified lookup.
