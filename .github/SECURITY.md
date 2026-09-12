# Security Policy

## Supported Versions

Forever PTO is a continuously deployed web application, not a versioned library:
[forever-pto.com](https://forever-pto.com) and
[docs.forever-pto.com](https://docs.forever-pto.com) always run the latest
`main`, and those deployments are the only supported versions. There is
nothing older to patch; fixes ship by deploying.

| Component | Supported |
| --- | --- |
| The planner, `forever-pto.com` | The latest deploy from `main` |
| The docs site, `docs.forever-pto.com` | The latest deploy from `main` |
| Anything older | No |

## Scope

The attack surface is deliberately small. The planner itself runs entirely in
the browser; the server holds payment and contact records and nothing else.

### In scope

- **The API route handlers** under `apps/web/src/app/api/` (`check-session`,
  `contact`, `health`, `markdown`, `payment`, `payment/activate`) and the
  Stripe webhook. Payment routes sit behind a Cloudflare rate limiter.
- **The Premium entitlement**, which travels in a signed HTTP-only cookie.
  Forging that signature would be a real finding.
- **The external service boundaries**: Stripe, Turso, and Resend.
- **The documentation site**, which is static assets on a Worker of its own.

### Out of scope

- Vulnerabilities in the platforms and services the app is built on:
  Cloudflare, Stripe, Turso, Resend, Next.js. Report those to them.
- Rate limiting, quota exhaustion or cost caused by ordinary use of the
  public routes, unless it bypasses the limiter that is in place.

### Documented trade-offs, not vulnerabilities

Some behaviour that looks reportable is a documented, deliberate decision.
Please check these before reporting:

- **Persisted client state is obfuscated, not encrypted** (XOR + base64 with a
  bundled key). It protects against nothing but casual inspection, on purpose:
  nothing confidential is stored behind it. See
  [ADR 0007](../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md).
- **The "I already donated" recovery path is unverified, and Premium is never
  revoked.** There are no accounts; the payment record is the entitlement.
  Both follow from that decision. See
  [ADR 0008](../adr/0008-premium-derived-from-payment.md).
- **The per-pull-request docs preview Workers are publicly reachable.** That
  is known: the Cloudflare Access application covers the planner previews and
  not the docs ones, and the fix is a second Access destination rather than a
  change in this tree. They serve the same public documentation as the live
  site.

A report that one of these exposes something *beyond* its documented scope
(confidential data behind the obfuscation, or an entitlement without any
payment record at all) is very much welcome.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests or discussions.** Report them privately instead.

### Preferred: GitHub private vulnerability reporting

1. Open [Report a vulnerability](https://github.com/fbuireu/forever-pto/security/advisories/new)
2. Fill in the form with the details below

Private reporting is open to any GitHub account and is the channel this project
uses.

### If private reporting is unavailable

Write to **contact@forever-pto.com**, or use the contact form in the app, and
say nothing about the finding anywhere public.

Whichever way it reaches me, include:

- The type of issue (payment bypass, cookie forgery, injection, leaked secret…)
- The affected route or component, and the location of the relevant source
  code if you found it
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code, if possible
- The impact of the issue, including how an attacker might exploit it

### What to expect

- **Acknowledgment**: I will acknowledge receipt within 48 hours
- **Updates**: I will keep you informed of the fix's progress
- **Timeline**: I aim to fix critical issues within 7 days
- **Credit**: I will credit you in the security advisory, unless you prefer to
  remain anonymous
- **Disclosure**: this project follows a 90-day responsible disclosure policy

Reports made in good faith will not result in legal action. Thank you for
helping keep Forever PTO and its users safe.

## Security Updates

Security fixes ship as ordinary commits to `main`, which deploys them; there is
no release to wait for and nothing for a user to update.
