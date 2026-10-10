# 22. Stripe.js loads on every page, for its fraud signals

Date: 2026-10-10

## Status

Accepted.

## Context

Stripe.js is the browser half of a Donation: the checkout's Payment Element and Express Checkout run inside its
iframes. It is also the input to Stripe's fraud detection, which reads how a visitor moves through the site before
the payment, and Stripe recommends loading it on every page for that reason rather than only on the one that takes
the card.

Until this decision the app loaded it when the checkout opened. `StripeElementsProvider` asked the memoised client in
`infrastructure/clients/payments/stripe/client.ts` on mount, so a visitor who never donated never fetched it, and the
guides recorded that as the rule. That bought three things the change has to keep: a blocked `js.stripe.com` (a
content blocker, a privacy extension, a proxy) produced no uncaught error and no console line, the checkout said the
form could not load and offered to try again, and nothing loaded the script twice. What was weighed:

- **Keep the checkout-only load.** It costs nothing on the pages where nobody pays, and Stripe sees nothing but the
  checkout itself, which is the signal its fraud detection is weakest without.
- **The bare `@stripe/stripe-js` import at the root.** It injects the script the moment it is imported, which is what
  Stripe's npm guide shows for this purpose, and it writes a load that fails before anything asked to the console
  itself, which a blocked visitor would carry on every page.
- **A `<script>` tag in the layout.** Stripe's own loader then finds a script that failed before it was asked and
  waits on it for good, so a blocked checkout would show its placeholder forever instead of the retry.

The owner weighed the page weight against the fraud signals and chose the signals.

## Decision

Every page asks for Stripe.js as it mounts, through the same memoised client the checkout uses. The locale layout
mounts `StripePreload` (`ui/modules/providers/StripePreload.tsx`), a render-null client component whose effect asks
`getStripeClientInstance().getStripePromise()` and swallows a failure, the missing key of a local build included. The
client keeps importing `@stripe/stripe-js/pure` and forgetting a rejected load, so:

- a blocked load fails quietly on every page, with no uncaught rejection, no console line and no log, because a
  blocked script is the visitor's setting and not a defect;
- the checkout asks the same client when it mounts, gets the instance the page loaded, and never fetches the script a
  second time;
- after a failed early load the checkout asks again, shows the panel that says the form could not load, and its retry
  loads the script once `js.stripe.com` answers.

Stripe's fraud-prevention cookies, `__stripe_mid` and `__stripe_sid`, are strictly necessary, so the load does not
wait for the consent banner; the banner lists them under the necessary category and the cookie policy says they may be
set on any page. The CSP, one rule for every path, admits what Stripe documents for Stripe.js: `js.stripe.com` and its
subdomains in `script-src` and `frame-src`, `hooks.stripe.com` in `frame-src` and `api.stripe.com` in `connect-src`.

## Consequences

- Every page requests Stripe.js and opens Stripe's own frames, whether or not the visitor ever donates: one more
  third-party script, and Stripe's requests, on the homepage, the legal pages and the planner. The app's own JavaScript
  grows only by the render-null component.
- Stripe sees every visitor who loads the script, which the cookie policy states in each of the six bundles.
- `StripePreload` is load-bearing for the fraud signals, and removing it silently returns the app to a checkout-only
  load: `app/[locale]/layout.test.tsx` fails when the layout stops mounting it, and `StripePreload.test.tsx` fails a
  quiet failure that becomes noisy and a checkout that loads the script twice.
- The contract suite keeps Stripe.js on its `pure` entry and every ask inside a function, and holds the CSP to the
  sources above ([`CODING_STANDARDS.md`](../CODING_STANDARDS.md)). The client and the component are described in
  [`apps/web/src/infrastructure/clients/AGENTS.md`](../apps/web/src/infrastructure/clients/AGENTS.md) and
  [`apps/web/src/ui/modules/AGENTS.md`](../apps/web/src/ui/modules/AGENTS.md).
