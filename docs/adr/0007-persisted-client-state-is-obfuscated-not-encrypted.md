# 7. Persisted client state is obfuscated, not encrypted

Date: 2026-07-26

## Status

Accepted, with the naming corrected. The mechanism is unchanged; what changed is that it must be called obfuscation everywhere, in code and in docs.

## Context

The Zustand stores persist to local storage through a wrapper that XORs the serialised value against a key shipped in the client bundle and base64-encodes the result. The key is in the bundle, so anyone who wants the plaintext has it. Calling that encryption invites two mistakes: putting something confidential behind it, and reasoning about the threat model as though a client-side cipher were one.

The original motivation is not recorded anywhere in the history, and this ADR does not invent one. Judged on its merits today it stands — but it stands as obfuscation.

What makes it acceptable is [ADR 0001](./0001-planner-runs-in-the-browser.md): almost everything persisted is a holiday calendar, a PTO count and a set of dates, and none of it is a credential. The premium store is the exception, and it is worth being exact about it rather than reassuring.

It persists the donor's email address, which is personal data, and `premiumKey`, which **is** the client-side gate: every Premium surface — `PremiumFeature`, the calendar's manual editing, the advanced metric cards — branches on that field alone, and because the planner runs entirely in the browser nothing re-checks it once `needsSessionCheck` is down. A hand-written blob therefore unlocks the tier without the server ever being asked, and it needs nobody's email to do it.

That is accepted on the same grounds as the unverified recovery path in [ADR 0008](./0008-premium-derived-from-payment.md), not on any claim that the blob is hard to forge: Premium is advanced metrics and manual editing of a Suggestion — nothing that stores data, spends money, or reveals anything about a donor. The session cookie gates nothing on its own: it is read in one place, the GET half of the check-session route, and all that produces is the value which seeds the client gate — it is a JWT verified against `JWT_SECRET` alone, with no lookup back to the payments table, so it is a bearer token with a 30-day life and not a live re-check. What obfuscation buys is narrower than it looks: a shared or borrowed machine does not show a donor's email in plain text in devtools. Treat it as that and nothing more.

## Decision

Persisted store state is obfuscated, not encrypted, and every description of it says so. The wrapper's only job is to keep the stored blob from being readable or hand-editable at a glance in devtools; it is not a confidentiality boundary and must never be treated as one.

## Consequences

- The wrapper is off in development and whenever the key is absent, so a missing key degrades to plain local storage rather than breaking the app.
- Do not extend this to anything that actually needs confidentiality. If a value would be damaging in a user's own hands, it belongs in the signed cookie or on the server, not here.
- A decode failure drops the value and logs it; the store falls back to its initial state rather than crashing.
- Anyone reading the store code sees cipher-shaped functions and may reasonably infer a security property that is not there. The naming rule is the only thing preventing that.
