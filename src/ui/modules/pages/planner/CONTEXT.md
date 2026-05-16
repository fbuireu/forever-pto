# planner

## Purpose

Main page module. Orchestrates the calendar view, holiday management, PTO alternatives, analytics, and user support. It is the sole entry point to the product's core functionality.

## Main sections

| Component | Role |
| --- | --- |
| `CalendarList` | Renders year months with selectable days |
| `PlannerPanel` | Alternatives manager + current PTO status |
| `HolidaysList` | Tabbed view of holidays (National / Regional / Custom) |
| `Summary` | Analytics dashboard with 5 charts |
| `ManagementBar` | Filter and action controls |
| `Legend` | Visual legend explaining day types |
| `Roadmap` | Feature map (completed / in-progress / planned / future) |
| `Contact` | Contact/feedback form |

## Subdirectories

- **`calendar/`** — Day rendering logic and state classification (`modifiers.ts`)
- **`holidays/`** — Holiday CRUD: table, add/edit/delete modals, Zod schemas
- **`summary/`** — The 5 analytics charts + reusable `MetricCard`
- **`support/`** — Interactive tutorial, FAQ, Troubleshooting
- **`utils/`** — Date helpers and day state predicates

## Conventions

- All interactive components are `'use client'`.
- Charts in `Summary` are imported with `dynamic()` to avoid blocking the initial render.
- `data-tutorial="*"` attributes mark elements for the interactive tutorial — do not remove them.
- Use `useShallow` when consuming multiple fields from a store.
- Animation config constants are defined outside the component (e.g. `STAT_CARD_MOTION_CONFIG`).

## Dependencies

- `@application/stores/*` — state source of truth
- `@ui/modules/core/` — design primitives
- `@domain/calendar` — suggestion engine
- `motion/react` — animations
- `next-intl` — translations

## Out of scope

Database queries, direct API calls, business logic (delegate to stores/services), global layout wrappers (in `app/[locale]`).
