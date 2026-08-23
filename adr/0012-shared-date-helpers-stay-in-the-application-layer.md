# 12. The shared date helpers stay in the application layer

Date: 2026-08-16

## Status

Accepted.

## Context

`application/shared/utils/dates.ts` is a thin wrapper over `temporal-polyfill`: twenty-six functions that
take a `Date`, do plain-date arithmetic and hand a `Date` back, plus `formatDate` and `getWeekdayNames`,
which reach `Intl`. There is no I/O in it, no DOM, no framework, no store, and nothing application-specific.

Three layers import it. The UI reads it in a dozen places, `application/` in three, and — the part that
raises the question — `domain/calendar/` in four: [`utils/helpers.ts`](../apps/web/src/domain/calendar/utils/helpers.ts), [`utils/cache.ts`](../apps/web/src/domain/calendar/utils/cache.ts),
[`metrics/utils/helpers.ts`](../apps/web/src/domain/calendar/metrics/utils/helpers.ts) and [`metrics/utils/streaks.ts`](../apps/web/src/domain/calendar/metrics/utils/streaks.ts). That is the domain importing from the layer above
it, which is the wrong direction for a dependency arrow, and it is one of exactly two such imports the
calendar domain has (`@application/dto/holiday/types` is the other).

The obvious repair is to move the file somewhere both layers may legally reach: a `src/shared/` tier under
the app, or a real `packages/` workspace member. Neither is as cheap as it looks.

- A fourth top-level directory beside `app/`, `application/`, `domain/`, `infrastructure/` and `ui/` needs a
  path alias, an entry in every layer contract that currently enumerates what it may import, a rule in
  [`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) (which asserts every layer root has a `CLAUDE.md`), and an answer to the
  question of what else belongs there — a tier with one file in it invites everything.
- A `packages/` member contradicts [ADR 0010](./0010-apps-web-and-apps-docs-monorepo-layout.md), which says
  the tier appears the day a real shared package exists. One file that only `apps/web` imports is not that
  day; `apps/docs` reaches app sources through the `@ui` alias and does not import this module at all.
- Moving it *down* into `domain/` is worse than the problem. `domain/` holds two bounded contexts and
  nothing else, so the file would either become a third thing that is not a context, or land inside
  `calendar/` — from where the UI, the export and the DTOs would all import planning-engine internals to get
  `formatDate`.

What the import actually costs is also worth stating plainly, because it is close to nothing. The rule the
calendar domain has to keep is *runtime* purity, not layer purity: it is evaluated inside a Web Worker with
no DOM and no server context ([ADR 0001](./0001-planner-runs-in-the-browser.md)), so an import that touches
`window`, `process` or a Node built-in breaks the planner in a way no server-side test catches. [`dates.ts`](../apps/web/src/application/shared/utils/dates.ts)
touches none of them. The arrow points the wrong way on the diagram and correctly at runtime.

## Decision

The shared date helpers stay at `application/shared/utils/dates.ts`, and `domain/calendar/` goes on
importing them through `@application/shared/utils/dates`.

The rejected alternative is a neutral `src/shared/` tier — rejected because it buys diagram tidiness and
pays for it with a directory whose membership rule nobody can state, at a moment when exactly two modules
would move into it.

The list in [`../apps/web/src/domain/CLAUDE.md`](../apps/web/src/domain/CLAUDE.md) is what makes this
enforceable by review: the calendar domain's outside imports are enumerated there and are meant to stay at
four. The test for a new one is the runtime, not the layer — does it resolve inside a Web Worker with no DOM
and no server context.

## Consequences

- **The enumerated import list in `domain/CLAUDE.md` is the enforcement mechanism, and there is no other.**
  Biome has no import-boundary rule. A fifth entry appearing there without a paragraph explaining why is the
  regression to catch in review.
- **This makes the layer diagram permanently inaccurate, and that is the cost.** A reader who checks the
  arrows before reading the prose will find domain importing application and reasonably assume it is a
  defect. That is what this file exists to answer.
- **It also means `dates.ts` cannot grow anything application-flavoured.** A helper here that reads a store,
  a cookie, an env var or the Cloudflare context would be imported straight into the Web Worker and would
  break the planner at runtime with no build error. `formatDate` and `getWeekdayNames` reaching `Intl` is the
  furthest this file goes, and `Intl` exists in workerd.
- **The same reasoning covers `@application/dto/holiday/types`**, the calendar domain's other upward import,
  which [`../apps/web/src/application/dto/CLAUDE.md`](../apps/web/src/application/dto/CLAUDE.md) records as a
  known exception safe only while that file stays types plus one const object.
- If a second app ever needs these helpers, this decision is superseded rather than amended: at that point
  the `packages/` tier ADR 0010 defers is genuinely warranted, and the move becomes a workspace change rather
  than a directory shuffle.
