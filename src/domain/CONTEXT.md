# domain

## Purpose

The domain layer contains pure business logic with no dependencies on infrastructure, UI, or framework concerns. Code here models the core problem — optimising PTO allocation — and must remain independently testable and deployable.

## Bounded contexts

| Directory | Responsibility |
| --- | --- |
| `calendar/` | PTO suggestion engine: bridge detection, strategy selection, alternative generation, metrics |
| `payment/` | Payment domain events, factories, and handlers using Effect.ts |

## Layer rules

- **Allowed imports**: `@application/dto/*`, `@application/shared/dates`, `next-intl` (locale type only)
- **Forbidden imports**: `@ui/*`, `@infrastructure/*`, browser globals, framework SDK types
- The one pragmatic exception is `HolidayDTO` from `@application/dto/holiday/types` — see `calendar/CONTEXT.md`

## Testing

Every module in this layer has a co-located `.test.ts` file. Tests run with Vitest. Cache modules (`calendar/utils/cache.ts`) expose `clearDateKeyCache()` / `clearHolidayCache()` specifically to support test isolation — call them in `beforeEach`.
