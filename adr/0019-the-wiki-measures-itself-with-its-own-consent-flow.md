# 19. The wiki measures itself, with its own consent flow

Date: 2026-09-12

## Status

Accepted.

## Context

`docs.forever-pto.com` measured nothing. Its `wrangler.toml` declares no `[observability]`, its HTML carried no
tag, and the only numbers available were Cloudflare's own request analytics. The question worth answering is
whether the wiki brings people to the planner, and nothing in the tree could answer it.

Two things looked like the same job and are not:

- **Observability**, meaning the platform's log and trace export that
  [ADR 0017](./0017-observability-is-the-platform-export.md) set up for the app. It does not apply here.
  `apps/docs/wrangler.toml` declares no `main`: Cloudflare serves the built assets directly, so there is no
  handler invocation, no outbound `fetch` and no binding call. Naming a `destinations` entry would create a
  destination that receives its own test message and nothing else, which is the exact trap
  [ADR 0018](./0018-the-platform-is-the-log-transport.md) was written to close. Getting real traces here means
  putting a Worker in front of static files, which costs invocations and answers nothing.
- **Analytics**, meaning what a browser reports. That is the half that can work, and it is what this records.

The app already does this, and reusing its implementation was the obvious move that does not survive contact:

- The consent UI is React under `@ui/modules/shared/cookie-consent/`, and it reads its strings through
  `next-intl` off the app's own message bundles, with `config/config.ts` typed against `en.json`. The wiki has
  Starlight i18n and two locales of its own.
- `BetterStackTracking.tsx` needs `next/script`, the premium Zustand store and the app's `package.json`
  version.
- `Analytics.tsx` needs `next/script`.
- The app's cookie table lists Stripe and `user-country` cookies the wiki never sets.

What the two can honestly share is the **library** (`vanilla-cookieconsent`, pinned to the same version) and
the **vocabulary**: the `analytics` category and the `ga4` and `betterStack` service ids. Sharing those keeps a
reader able to move between the two implementations. Sharing the components would mean porting next-intl and
the stores into an Astro island to save a file that is shorter than the port.

## Decision

The wiki carries its own consent flow and its own tags, in plain TypeScript with no React island.
[`src/lib/analytics/consent.ts`](../apps/docs/src/lib/analytics/consent.ts) configures
`vanilla-cookieconsent` with the library's own UI, in English and Spanish chosen off
`document.documentElement.lang`, and wires the result to both services;
[`src/components/Head.astro`](../apps/docs/src/components/Head.astro) is a Starlight `Head` override that
emits Consent Mode defaults of `denied` before `gtag.js` loads, and boots the consent module.

**Google Analytics uses the app's measurement id, not one of its own.** Both sites are subdomains of
`forever-pto.com`, so the GA4 cookie lands on the parent domain and one id gives a single session that runs
from the wiki into the planner, which is the question being asked. The two are separated with the `Hostname`
dimension. A second data stream would split that session and lose the funnel. The id therefore moved to one
repository variable, `GOOGLE_ANALYTICS_ID`, and each workflow maps it to the prefix its bundler inlines:
`PUBLIC_` for Astro, `NEXT_PUBLIC_` for Next. It was an environment variable on both `web-*` before, with the
same value in each.

**Better Stack RUM uses a source of its own per stage, under one variable name.** Sharing the app's would file
wiki sessions under the app's `release`, and the docs package version is `0.0.0` for the life of the
repository by [ADR 0011](./0011-per-package-versioning-with-a-bridge-tag.md); it would also put wiki noise in
the app's error surface, since `trackingEnvironment` classifies by hostname. So `BETTER_STACK_TRACKING_TOKEN`
is a variable on `docs-development` and `docs-production`, one name, two values.

**Which forced the `build` job to declare an environment, and that is the part worth knowing.** `docs.yml`
builds once and both `preview` and `deploy` ship the same `docs-dist` artifact, so a token inlined at build
can only have one value, and the job had no `environment:` at all, which makes any environment variable an
empty string. `build` now declares
`environment: ${{ github.event_name == 'pull_request' && 'docs-development' || 'docs-production' }}`, so a
pull request bakes the development token and a push to `main` bakes the production one, each going to the job
that ships it. The alternative was two build jobs and two artifacts, which duplicates a job that also runs
the docs Playwright suite.

The rejected alternatives are reusing the app's React consent UI, a second GA4 stream, a shared RUM source,
and observability on a Worker that does not exist.

## Consequences

- **No tag loads before consent, and that is asserted rather than reviewed.**
  [`e2e/cookie-consent.spec.ts`](../apps/docs/e2e/cookie-consent.spec.ts) checks the banner appears, that no
  `_ga*` cookie and no `betterstack.net` script exist before an answer, that Consent Mode starts `denied`,
  that rejecting stores the choice and still sets nothing, that accepting emits the `granted` update, and that
  the preferences modal offers a switch per service with `necessary` locked. Flipping the default in
  `Head.astro` from `denied` to `granted` turns exactly one of those red, which is how it was verified.
- **The spec has to tell the browser it is not a robot.** `vanilla-cookieconsent` defaults `hideFromBots` to
  true and the check is `/bot|crawl|spider|slurp|teoma/i.test(userAgent) || navigator.webdriver`. Playwright
  sets `navigator.webdriver`, so the banner never renders and `run()` resolves without an error: the failure
  looks like broken code and is the library working as configured. The spec overrides that property in a
  `beforeEach`. Do not answer this by setting `hideFromBots: false`, which would trade a real production
  default for a test convenience.
- **The wiki now sets security headers, and it set none before.**
  [`public/_headers`](../apps/docs/public/_headers) carries the CSP that admits the two tags plus HSTS,
  `nosniff`, `DENY` framing and a referrer policy. It is a separate statement from the app's, which lives in
  `next.config.ts` and is asserted by the contract suite; this one has no Worker to serve it from, so
  Cloudflare's static-asset `_headers` support is what applies it. The two can drift and nothing compares
  them.
- **Both tags report a floor, not a census.** Better Stack RUM is built on Sentry's browser SDK and posts to a
  Sentry `envelope` endpoint, which ad blockers filter aggressively; GA4 is blocked at least as often. The
  numbers that cannot be blocked are Cloudflare's own request analytics. Read the RUM and GA4 figures knowing
  which population they describe.
- **The wiki sends no `release` to Better Stack, unlike the app.** There is no honest value to send: the
  package version never moves. An error in the wiki is therefore not grouped by version, which is a real loss
  and the reason it is written here rather than discovered.
- **`apps/docs` reads environment variables for the first time**, so it has an
  [`.env.example`](../apps/docs/.env.example) now. Both are optional: without them the site builds, serves,
  and shows no banner at all, because there is nothing to ask about.
- Where this bites: [`apps/docs/CLAUDE.md`](../apps/docs/CLAUDE.md), and the published wiki's
  *Cookie consent*, *Observability* and *Secrets* pages.
