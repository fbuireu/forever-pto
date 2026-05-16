# infrastructure

## Purpose

Technical implementation details: external service clients, persistence, email, payments, logging, i18n routing, and business-logic-free services (calendar, location, holidays). No domain or application logic lives here.

## Layer contract

- May import from `application/` (DTOs, shared types, use-case interfaces)
- May NOT import from `ui/`
- All external service calls go through Effect-based wrappers (see `clients/`)
- Server actions (`actions/`) are the only entry points from Next.js server context into application use-cases

## Structure

| Folder | Contents |
| --- | --- |
| `clients/` | Effect service tags + Live layers for all external SDKs (Turso, Stripe, Resend, BetterStack) |
| `services/` | Domain-specific service implementations (calendar, payments, location, holidays, etc.) |
| `actions/` | Next.js server actions — thin wrappers that extract CF context and call use-cases |
| `api/` | Shared API response utilities and error code constants |
| `i18n/` | next-intl config, locale constants, routing, URL helpers |
| `proxy/` | Edge middleware (location cookie detection) |
| `workers/` | Web Worker for offloading heavy calendar calculations |
| `well-known/` | RFC/SEP endpoint handlers (API catalog, MCP card) |
| `images/` | Cloudflare image loader for Next.js |
| `markdown/` | Server-side markdown page builder for meta content |
| `layers.ts` | `AppLayer` — merges all Live layers for use in API routes and server components |
| `errors.ts` | All tagged errors for the application (`DatabaseError`, `PaymentError`, etc.) |

## Key patterns

- **Effect DI**: every external call goes through a service tag (`TursoService`, `StripeServerService`, etc.) injected via `AppLayer`. Run at the boundary with `Effect.runPromise(...pipe(Effect.provide(AppLayer)))`.
- **`getBetterStackInstance()` singleton**: used in pure utility functions that lack an Effect context (e.g., `getRegions`, `getCountries`). Acceptable exception — do not spread further.
- **Server actions** call `getCloudflareContext()` and pass config down to use-cases as plain objects. Use-cases must not call `getCloudflareContext()` themselves.
