# Security Policy

## Supported Versions

Forever PTO is a continuously deployed web application, not a versioned
library: [forever-pto.com](https://forever-pto.com) always runs the latest
`main`, and that deployment is the only supported version. There is nothing
older to patch — fixes ship by deploying.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub
issues.**

If you discover a security vulnerability, please report it privately:

### Preferred Method: GitHub Private Vulnerability Reporting

1. Go to the [Security tab](https://github.com/fbuireu/forever-pto/security)
2. Click "Report a vulnerability"
3. Fill in the details about the vulnerability

### Alternative: Email

If you cannot use private reporting, write to **contact@forever-pto.com**, or use the
contact form in the app, with:

- Type of issue (e.g., payment bypass, cookie forgery, injection, etc.)
- The affected route or component, and the location of the relevant source
  code if you found it
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: we'll acknowledge receipt within 48 hours
- **Updates**: we'll provide updates on the fix progress
- **Timeline**: we aim to fix critical issues within 7 days
- **Credit**: we'll credit you in the security advisory (unless you prefer to
  remain anonymous)
- **Disclosure**: we follow a 90-day responsible disclosure policy

## Where to Look

The attack surface is deliberately small. The planner itself runs entirely in
the browser; the server holds payment and contact records and nothing else.
The parts worth a security researcher's attention:

- **The API route handlers** under `src/app/api/` — `check-session`,
  `contact`, `health`, `markdown`, `payment`, `payment/activate` — and the
  Stripe webhook. Payment routes sit behind a Cloudflare rate limiter.
- **The Premium entitlement**, which travels in a signed HTTP-only cookie.
  Forging that signature would be a real finding.
- **The external service boundaries**: Stripe, Turso, and Resend.

## Known Design Decisions — Not Vulnerabilities

Some behavior that looks reportable is a documented, deliberate trade-off.
Please check these before reporting:

- **Persisted client state is obfuscated, not encrypted** (XOR + base64 with a
  bundled key). It protects against nothing but casual inspection, on purpose —
  nothing confidential is stored behind it. See
  [ADR 0007](./adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md).
- **The "I already donated" recovery path is unverified, and Premium is never
  revoked.** There are no accounts; the payment record is the entitlement.
  Both follow from that decision. See
  [ADR 0008](./adr/0008-premium-derived-from-payment.md).

A report that one of these exposes something *beyond* its documented scope —
confidential data behind the obfuscation, or an entitlement without any
payment record at all — is very much welcome.
