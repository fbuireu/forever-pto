# 4. Cloudflare Workers as the deployment target

Date: 2026-07-26

## Status

Accepted. Follows from [ADR 0001](./0001-planner-runs-in-the-browser.md); the first constraint it imposed is [ADR 0005](./0005-temporal-polyfill.md).

## Context

With the planner in the browser ([ADR 0001](./0001-planner-runs-in-the-browser.md)) the server handles payments, contact submissions, a webhook and some static rendering — bursty, low-volume work with long idle stretches between requests. An always-on Node process, or a managed Next.js host priced like one, would have been paying for that idle time.

Running Next.js on Workers is not free either: it needs the OpenNext adapter, and the runtime is not Node, so every standard-library assumption has to be checked rather than assumed.

## Decision

The app is deployed to Cloudflare Workers through OpenNext. The platform's primitives are used directly rather than abstracted behind a portability layer: R2 for the incremental cache, KV for the payment rate limiter, the Cloudflare request context for request-scoped configuration, and a custom image loader in place of the built-in optimiser.

## Consequences

- The lock-in is real and spread across the codebase. Moving off the platform is a multi-day job, not a config change.
- The bare `getCloudflareContext()` is only valid inside a request; the `{ async: true }` form falls back to wrangler's platform proxy and so also works during the build, which is how `robots.ts` and `getPublicEnv.ts` read configuration with no request in flight — `sitemap.ts` and the `.well-known` handler use the same form but are not prerendered, so they resolve per request. Either way it is entry-point territory: server actions and route handlers may call it, use-cases may not, and must receive configuration as plain values.
- The runtime is not Node. Availability of a standard-library API has to be checked against the compatibility flags rather than assumed — see [ADR 0005](./0005-temporal-polyfill.md) for the case that already bit us.
- Country detection leans on the platform: the edge exposes the visitor's country on the request, so no geolocation service is needed on the common path.
- A local `pnpm dev` run proves nothing about the deployed runtime. Anything runtime-sensitive has to be verified in a preview deploy.
