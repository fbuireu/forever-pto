# domain/calendar

## Purpose

Core PTO suggestion engine. Computes optimal vacation days by finding "bridges" — contiguous workday blocks that, when taken as PTO, connect weekends and public holidays into extended stretches off. This is business logic and belongs in the domain layer.

## Subdirectories

| Directory | Role |
| --- | --- |
| `utils/` | `cache.ts` — date-key and holiday-set caches; `helpers.ts` — bridge detection, workday enumeration |
| `suggestions/` | `generateSuggestions.ts` — entry point for suggestion generation; `utils/selectors.ts` — bridge-ranking and selection algorithms |
| `alternatives/` | `generateAlternatives.ts` — produces distinct alternative PTO plans using multiple bridge-ordering strategies |
| `metrics/` | `generateMetrics.ts` — computes analytics for a suggestion; `utils/helpers.ts` — individual metric calculations |

## Key concepts

**Bridge** — a set of PTO days whose `effectiveDays / ptoDaysNeeded` ratio (efficiency) is above the minimum threshold. Bridges expand to absorb adjacent weekends and holidays, so 1 PTO day bridging a Monday to a holiday weekend can yield 4+ days off.

**FilterStrategy** — three selection strategies exported from `types.ts`:

- `GROUPED` — prefer multi-day blocks, secondary sort by efficiency
- `OPTIMIZED` — prefer high-efficiency bridges first
- `BALANCED` — two-pass greedy scoring: prioritises high-value long bridges, then fills remaining budget

**Scoring** (BALANCED) — `score = (efficiency × 0.6 + normalisedSpan × 0.4) × bonus`. Constants in `const.ts`.

## Cache protocol

`clearDateKeyCache()` and `clearHolidayCache()` **must** be called before each full suggestion run. The worker (`infrastructure/workers/calculations/worker.ts`) owns this responsibility — do not call them from inside `generateSuggestions`.

## Notable cross-layer dependency

`HolidayDTO` is imported from `@application/dto/holiday/types`. Strictly it belongs in the domain, but moving it would require updating 26+ import sites. Treat this as a known pragmatic exception until a dedicated refactor is planned.

Date utilities live in `@application/shared/dates` (pure functions, no side effects). `@ui/utils/dates` re-exports everything from there for backward compatibility — UI code can continue using either path.

## Constants

All algorithm tunables are in `const.ts` (`PTO_CONSTANTS`). Each field has an inline comment explaining the meaning and the unit. Do not use magic numbers elsewhere — add to `PTO_CONSTANTS` instead.
