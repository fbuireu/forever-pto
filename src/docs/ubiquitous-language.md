# Ubiquitous Language — Forever PTO

Domain reference for developers. Every term here maps directly to a concept in the codebase.

---

## Core Domain

### PTO (Paid Time Off)
The user's annual budget of vacation days. Entered as a number (default: 22). Stored as `ptoDays` in `FiltersState`.

### Suggestion
The primary output of the calculation engine. A `Suggestion` contains:
- `days` — ordered array of `Date` objects: the specific PTO dates to request
- `bridges` — zero or more `Bridge` objects detected within those days
- `strategy` — which `FilterStrategy` produced it
- `metrics` — a `Metrics` snapshot computed after generation

Only one Suggestion is "active" at a time. It lives in `currentSelection` in `HolidaysState`.

### Alternative
Any other Suggestion generated in the same run. The engine produces up to `maxAlternatives` alternatives (default: 4) using different bridge-selection orderings. Alternatives are displayed in the `AlternativesManager`. The user can switch the active alternative — this updates `currentSelection` and `currentSelectionIndex`.

**Language nuance**: "Alternative" ≠ second-best. Alternatives are peers of the main suggestion, each optimised differently. In UI copy: "Option 1 (Recommended)", "Option 2", "Option 3", etc.

### Bridge
A strategic gap between two non-working days that can be "filled" with 1–3 PTO days to create a longer continuous break. For example: a Friday public holiday + 1 PTO day on the preceding Thursday = 4-day weekend.

```
Bridge {
  startDate    // first day of the extended block
  endDate      // last day of the extended block
  ptoDaysNeeded  // PTO days required to fill the gap (1, 2, or 3)
  effectiveDays  // total days off when bridge is activated
  efficiency     // effectiveDays / ptoDaysNeeded
  ptoDays        // the specific dates to request
}
```

### Holiday
A single calendar day where the user does not work. Three variants:

| Variant | `HolidayVariant` | Source |
|---|---|---|
| National | `national` | Official country-wide public holidays |
| Regional | `regional` | Province/region-specific holidays |
| Custom | `custom` | User-created (company days, personal dates) |

All three are stored together in `HolidaysState.holidays` and treated uniformly by the calculation engine. The type distinction is only used for display, analytics, and the "Day Off Composition" chart.

### Manual Day
A date the user manually selected on the calendar (not auto-suggested). Stored in `manuallySelectedDays`. Manual days count against the PTO budget but are never removed by recalculation. They are sent to the worker as `manualDays` and excluded from auto-suggestion slots.

### Removed Day
A date from the active Suggestion that the user explicitly deselected. Stored in `removedSuggestedDays`. These are sent to the worker as `excludedDays` so the engine avoids re-suggesting them. Cleared to `[]` when a new calculation result arrives.

### Remaining Days
`ptoDays - activeSuggestedCount - manuallySelectedCount`. Displayed live in `PtoStatus`. When remaining > 0, the user still has PTO budget to assign. Becomes 0 when the plan is fully allocated.

---

## Calculation Engine

### FilterStrategy
The algorithm used to rank and select bridges. Three values:

| Strategy | `FilterStrategy` | Behaviour |
|---|---|---|
| Grouped | `grouped` | Prioritises long continuous blocks. Lower total efficiency but psychologically satisfying. Min efficiency: 2.0. |
| Optimised | `optimized` | Maximises the efficiency ratio. Gets the most total days off. May produce scattered short breaks. Min efficiency: 2.5. |
| Balanced | `balanced` | Mixes grouping and efficiency. Medium-length blocks, versatile. |

Strategy is persisted in `FiltersState` and sent to the Web Worker with every calculation request.

### Efficiency
`effectiveDays / ptoDaysNeeded`. The multiplier effect of a bridge.

| Constant | Value | Meaning |
|---|---|---|
| `PERFECT` | 4.0 | 1 PTO day → 4 days off |
| `GOOD` | 3.0 | 1 PTO day → 3 days off |
| `ACCEPTABLE` | 2.5 | threshold for Optimised strategy |
| `MINIMUM` | 2.0 | threshold for Grouped / Balanced |

### Effective Days
The total days off when all suggested and manual dates are taken: PTO days + holidays + weekends naturally enclosed in the resulting blocks.

### Bonus Days
`effectiveDays - ptoDaysUsed`. The free days gained by intelligent scheduling. Shown in the summary as the headline metric.

### Metrics
Analytics computed for a Suggestion post-generation (`generateMetrics`):

| Field | Description |
|---|---|
| `longWeekends` | Consecutive 3–4-day break count |
| `restBlocks` | Separate vacation periods (gaps > 7 working days) |
| `maxWorkingPeriod` | Longest consecutive working streak (stress proxy) |
| `averageEfficiency` | Mean efficiency across all bridges used |
| `bonusDays` | Free days gained |
| `totalEffectiveDays` | PTO + holidays + bonus |
| `quarterDist` | `[Q1, Q2, Q3, Q4]` day distribution |
| `bridgesUsed` | Count of bridges activated |
| `longestVacation` | Single longest continuous vacation |
| `firstLastBreak` | `{ first, last }` formatted dates |

---

## User Tiers

### Free Tier
Default. No authentication, no email required. Access to:
- Auto-generated vacation plan (all three strategies)
- Country, region, year, and strategy selection
- Add or remove auto-suggested days (not manual free-form editing)
- Basic efficiency stats and calculators
- Language and theme switching

**Not available on free tier**: manual calendar editing, export, custom/company holidays, allow past days, carry-over months, editing or deleting any holiday, advanced charts and analytics.

### Premium (Lifetime)
Minimum donation of €1 (one-time, currency varies by locale). Activated by an email-scoped key. Unlocks everything the free tier lacks:
- Manual calendar editing (add, remove any day freely)
- Export to Google Calendar / Outlook / Apple Calendar / PDF
- Custom and company holidays (add, edit, delete)
- Allow past days — plan even if dates have already passed
- Carry-over months — extend the planning window into the next year
- Edit and delete any holiday (national, regional, or custom)
- Full analytics: advanced metrics, Year Summary, visual charts (Day Off Composition, Quarter Distribution, Annual Timeline, Long Blocks per Quarter), efficiency scoring and insights
- Up to 4 Alternatives (free tier: main suggestion only)

**Language nuance**: "Premium" and "Lifetime" are used interchangeably in the UI. There is no subscription. The minimum contribution is €1 — it is framed as a voluntary donation, not a fixed price. The activation key is personal and non-transferable but can be used across devices. Session validity is cached for 24 hours; after that, `/api/check-session` is called to re-verify.

### Premium Key (`premiumKey`)
A token stored in `PremiumState`. `null` = free tier. Non-null = premium. Never treated as a password — stored in obfuscated `localStorage`.

---

## Calendar Interaction

### Toggle Day
`toggleDaySelection({ date, totalPtoDays, locale, allowPastDays })`. The single action for all calendar clicks:
- Click a **suggested day** → removes it (goes to `removedSuggestedDays`)
- Click a **removed day** → re-adds it as a manual day
- Click a **manual day** → removes it
- Click a **free day** → adds it as a manual day (only if `remaining > 0`)

### Reset Manual Changes
Clears both `manuallySelectedDays` and `removedSuggestedDays`, restoring the active suggestion to its original state. Does not trigger a new worker calculation.

---

## State Stores

| Store | Responsibility |
|---|---|
| `useFiltersStore` | User config: `ptoDays`, `country`, `region`, `year`, `strategy`, `allowPastDays`, `carryOverMonths` |
| `useHolidaysStore` | Calculation state: holidays, suggestion, alternatives, `currentSelection`, manual/removed days |
| `usePremiumStore` | Session: `premiumKey`, `userEmail`, payment UI state, currency |
| `useLocationStore` | Geographic cache: countries, regions |

All stores persist to `localStorage` via XOR obfuscation (not a security measure — prevents casual data exposure in devtools).

---

## Time Configuration

### Year
The planning year (`year` in `FiltersState`, stored as string). Defaults to current year.

### Allow Past Days (`allowPastDays`)
When `true`, the engine considers dates in the past when generating suggestions. Useful for year-end carryover planning.

### Carry-Over Months (`carryOverMonths`)
How many months into the following year PTO is valid. Extends the month range passed to the worker. Default: 0.

---

## Calculation Worker

Runs in a Web Worker (`calculations.worker.ts`) to avoid blocking the UI thread. Receives a `CalculateSuggestionsRequest` and emits a `CalculateSuggestionsResponse`.

### `autoSuggestCount`
An optional cap on how many auto-suggestions the worker generates. Computed in `useCalculationsWorker`:
- `undefined` when `ptoDays` changed since last result (allows full new budget)
- `Math.min(budget, activeSuggestedDays)` otherwise (respects user's removed days)

This ensures removing a suggested day does not cause the worker to auto-refill that slot on the next manual-day addition.

### `excludedDays`
Serialised `removedSuggestedDays` passed to the worker. The engine treats these as pseudo-holidays so they cannot be re-selected.

---

## Glossary Cheatsheet

| Term | Short definition |
|---|---|
| Bridge | 1–3 PTO days that extend a holiday into a longer break |
| Efficiency | `effectiveDays / ptoDaysNeeded` — the multiplier |
| Suggestion | Primary auto-generated vacation plan |
| Alternative | Peer plan with different bridge selection |
| Manual day | User-added date outside the auto-suggestion |
| Removed day | Auto-suggested date the user deselected |
| Remaining days | Unallocated PTO budget (`ptoDays - active - manual`) |
| Rest block | A continuous vacation period (separated by > 7 working days) |
| Bonus days | Free days gained (`effectiveDays - ptoDaysUsed`) |
| Carry-over | PTO valid beyond Dec 31 into the next year |
| Premium key | Activation token for lifetime tier |
