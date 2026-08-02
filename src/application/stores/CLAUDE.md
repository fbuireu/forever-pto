# src/application/stores

## Purpose

All client state. Because the planner runs in the browser
([ADR 0001](../../../docs/adr/0001-planner-runs-in-the-browser.md)), these five Zustand stores are the
product's real database: the Holiday calendar, the Suggestion and its Alternatives, the user's manual edits
and their Premium session all live here and nowhere else. Lose local storage and the plan is gone.

The rest of the application layer contract is in [`../CLAUDE.md`](../CLAUDE.md).

## Files

| File | Holds |
| --- | --- |
| `filters.ts` | `useFiltersStore` — the planning inputs |
| `holidays.ts` | `useHolidaysStore` — the calendar, the plan, and the user's edits to it |
| `location.ts` | `useLocationStore` — the Country and Region option lists |
| `premium.ts` | `usePremiumStore` — the Premium session and the upgrade modal |
| `ui.ts` | `useUIStore` — donate popover and currency; the one store with no persistence |
| `crypto.ts` | `obfuscatedStorage`, the zustand `PersistStorage` the four persisted stores share. Not a store |
| `utils/crypto.ts` | `obfuscate` / `deobfuscate` / `base64Encode` / `base64Decode`, plus `TWENTY_FOUR_HOURS` and `BASE64_PATTERN`. Not a store |
| `types.ts` | The action parameter objects shared between the stores and their callers — `GenerateSuggestionsParams`, `MainThreadSuggestionsParams`, `FetchHolidaysParams`, `PlanningWindowParams`, `AddHolidayParams`, `EditHolidayParams`, `AlternativeSelectionBaseParams` |

## The five stores

| Store | Owns | Persisted |
| --- | --- | --- |
| `filters` | `ptoDays`, `allowPastDays`, `country`, `region`, `year`, `carryOverMonths`, `strategy` | all but `year` |
| `holidays` | `holidays`, `suggestion`, `alternatives`, `maxAlternatives`, `currentSelection`, `currentSelectionIndex`, `previewAlternativeIndex`, `manuallySelectedDays`, `removedSuggestedDays`, `isCalculating` | all but `previewAlternativeIndex` and `isCalculating` |
| `location` | `countries`, `regions` | nothing |
| `premium` | `premiumKey`, `userEmail`, `lastVerified`, `needsSessionCheck`, `isLoading`, `modalOpen`, `currentFeature` | the first four |
| `ui` | `donatePopoverOpen`, `donatePopoverIsOpening`, `currency`, `currencySymbol` | nothing |

`setCountry` clears `region` in the same `set` call — a Region code is only meaningful under its Country, and
leaving a stale one produces a plan with holidays from the wrong place.

## Persistence is obfuscated, not encrypted

`crypto.ts` XORs the serialised blob against `NEXT_PUBLIC_STORAGE_KEY` and base64-encodes it. The key ships in
the client bundle, so this is obfuscation and nothing more — never call it encryption, and never put anything
confidential behind it ([ADR 0007](../../../docs/adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)).
The exported names say so — `obfuscate`, `deobfuscate`, `obfuscatedStorage` — and so do the log messages. Only
the two file names still read as a cipher, because renaming them would break the paths the guides above this
folder quote; the vocabulary inside them is the part that matters.

Three branches, chosen once at module load:

- **No `window`** — a no-op storage, so importing a store on the server neither reads nor writes.
- **Development, or `NEXT_PUBLIC_STORAGE_KEY` missing** — plain local storage. A missing key degrades, it does
  not break, so devtools show readable JSON locally and obfuscated blobs in production.
- **Otherwise** — obfuscated. A failed decode logs and returns `null`, which zustand treats as "nothing
  stored"; the store keeps its initial state rather than crashing.

**`partialize` is the whole persistence contract.** A field absent from it is browser-session state by
design, and three of those omissions are load-bearing:

- **`year` is not persisted, and `filters.ts` has a `migrate` that strips it.** The bumped
  `STORAGE_VERSION` exists for exactly this: a v1 blob still carries a `year`, and the shallow merge would
  revive last year's value over the current one. Someone returning in January would silently plan the year
  they left.
- **`isCalculating` is not persisted.** It is set true before a worker run and cleared by the response; a
  persisted `true` would rehydrate into a permanently frozen calendar.
- **`previewAlternativeIndex` is not persisted.** It is hover state and is re-derived from
  `currentSelectionIndex` on rehydration.
- **`location` persists nothing at all, and its `migrate` drops whatever it finds.** `CountriesClient.tsx`
  pushes the server-rendered Country list into the store on mount and `Regions.tsx` re-derives the Regions
  from the persisted Country, so both fields were overwritten before anything could read the stored copy —
  paying to serialise, obfuscate and base64 roughly 250 localised entries on every write for nothing.
  `STORAGE_VERSION` went to 3 to retire the v2 blobs that still carry those lists, and `migrate` returns an
  empty object: dropping is the honest answer here, and without a `migrate` zustand logs an error instead of
  dropping quietly.

**`Date` does not survive JSON.** `partializeHolidays` maps every `Date` to an ISO string — inside
`holidays`, and inside `days`, `bridges[].startDate`, `bridges[].endDate` and `bridges[].ptoDays` of each
Suggestion — and `onRehydrateStorage` maps them all back through `ensureDate`. Adding a `Date` anywhere in
persisted holidays state means editing both halves; miss one and you get a string where the calendar expects
a `Date`, which only surfaces at render.

`onRehydrateStorage` runs where `localStorage` may be absent, so its error branch reaches it as
`globalThis.localStorage?.` rather than the bare global.

## Selection indices

`currentSelectionIndex` and `previewAlternativeIndex` address one flat list: **index 0 is `suggestion`, index
*n* is `alternatives[n - 1]`**. There is no separate index space for Alternatives. `setCalculationResult`
builds `[suggestion, ...alternatives]` and indexes into it; `resetManualSelection` and
`utils/modifiers.ts` in the planner both re-derive with the `index === 0 ? suggestion : alternatives[index - 1]`
form. Introducing an off-by-one here silently applies the wrong plan rather than throwing.

The rehydration guard `currentSelectionIndex > alternatives.length` exists because `maxAlternatives` can
shrink between sessions, leaving a persisted index that names nothing. It resets to the base Suggestion.

## Two ways a plan gets calculated

The same pipeline exists twice, and the two halves must stay in step:

- **The normal path** is the Web Worker. `useCalculationsWorker.ts` posts to `worker.ts`, which runs
  `generateSuggestions`, `generateAlternatives` and `generateMetrics` off the main thread and hands the result
  back through `setCalculationResult`. See
  [`../../infrastructure/workers/CLAUDE.md`](../../infrastructure/workers/CLAUDE.md).
- **The store's own `generateSuggestions` action** runs the same three engine calls on the main thread. Its
  one caller is the Troubleshooting reset in `Troubleshooting.tsx`, which fires it after `resetToDefaults()`
  has cleared the manual edits.

**The Troubleshooting reset clears two stores and deliberately not the third.** Its copy promises that
clearing local storage "resets everything back to defaults", so it calls `resetToDefaults` on the holidays
store *and* on the filters store — clearing only the first left a corrupt Country, Region or budget in place
while telling the user all data had been reset, which is precisely the state the button exists to escape.
It then re-reads the filters through `getState()` rather than the values captured before the reset, and
skips the re-fetch entirely when the default empty Country is what it finds; fetching against `''` would
plan a year with no Holidays in it. `usePremiumStore.resetPremiumStore` is **not** called and must not be:
Premium is derived from the payment record and access is never revoked from a donor
([ADR 0008](../../../docs/adr/0008-premium-derived-from-payment.md)), so a troubleshooting button that
logged a paying user out would be a defect, not a more thorough reset. That action having no caller is the
correct state, not dead code to wire up.

**They compute the same plan from the same inputs, and that is a maintained property, not a coincidence.**
The store's action reproduces the worker's rules line for line:

- **Manual Days become `manual-N` pseudo-Holidays of Variant Custom**, so the engine cannot re-suggest a date
  the user has already spent budget on.
- **Removed Days do not.** They travel as the engine's `removedDays` parameter, which reaches
  `getAvailableWorkdays` and nothing else. That distinction is the whole point: both were pseudo-Holidays
  once, and a Removed Day then counted as a Free Day when a neighbouring Bridge expanded and was scored,
  inflating its Efficiency. A day the user told us they will work must stop being a placement candidate
  without becoming a day off. Never route them back through the holidays array.
- **The budget is `Math.max(0, autoSuggestCount ?? ptoDays - manualDays.length)`**, which is why
  `MainThreadSuggestionsParams` carries an `autoSuggestCount` its only caller never passes. That field stays
  there rather than on the shared `GenerateSuggestionsParams` in `types.ts` because the worker path derives
  the count inside `useCalculationsWorker.ts` instead of taking it from its caller; promoting it would put a
  field on the worker's params that nothing there reads.
- **Both pass the Planning Window's `year` to `generateMetrics`.** It used to be inferred from the earliest
  placed PTO Day, which measured a plan starting in the Carry-over Months against the following year.
- **Both guard on `holidaysWithManual.length === 0`.** A calendar with no Holidays and only Removed Days now
  short-circuits, which it did not when the Removed Days padded the array the guard counted.

The `describe('generateSuggestions agrees with the worker')` block in `holidays.test.ts` mirrors the
assertions in `worker.test.ts`; change one side and both fail. Editing either pipeline without the other is
how the same Planning Window came to produce two different plans.

One difference is left on purpose: when the budget clamps to zero the worker replies with an empty Suggestion
carrying zeroed Metrics, while the store writes `null` across `suggestion`, `alternatives` and
`currentSelection` — its existing "no plan" state, which the calendar already renders.

Both must call `clearDateKeyCache()` and `clearHolidayCache()` before every run. The engine memoises the
holiday set under one fixed key and never evicts it, so a second run without a clear silently reuses the
previous run's Holidays — a structurally valid, wrong answer with no error
([ADR 0006](../../../docs/adr/0006-caller-owned-calculation-caches.md)). These two are the only callers the
ADR sanctions; a third means switching to a content-derived cache key, not adding a third `clear` pair.

`generateSuggestions`, `generateAlternatives`, the cache module and `getHolidays.ts` are reached through
`await import(...)` inside the actions, not top-level imports. That keeps the bulk of the planner out of the
bundle any page that merely touches the store would otherwise pull in. Converting one to a static import is
not a tidy-up.

**`generateMetrics` is the exception, and it is imported statically.** `toggleDaySelection` is synchronous and
returns a `boolean`, so it cannot await an import without changing its signature and every call site with it.
The cost is real — that import drags `metrics/utils/helpers.ts` and `temporal-polyfill` behind it into any
chunk that reads this store — and making it dynamic is not a tidy-up either.

## Logging is reached through a dynamic import

**No file here imports the BetterStack client statically, and none holds a module-scope `logger`.** That
client's own top-level imports pull in `@logtail/edge` and `@opennextjs/cloudflare`, so a static import lands
both in the client chunk of every component that reads a store — which is every planner and marketing screen.
Each of `crypto.ts`, `filters.ts`, `holidays.ts`, `location.ts` and `premium.ts` therefore declares the same
local helper, the one the UI layer's `adapters/payments/checkout.ts` uses
([`../../ui/CLAUDE.md`](../../ui/CLAUDE.md)):

```ts
const log = (write: (logger: BetterStackClient) => void) => {
  void import('@infrastructure/clients/logging/better-stack/client').then(({ getBetterStackInstance }) => {
    write(getBetterStackInstance());
  });
};
```

A call site is `log((logger) => logger.logError(message, error, context))`. The `import type { BetterStackClient }`
beside it is erased, so it costs nothing.

**Nothing awaits that import.** Several of these actions are called synchronously from React —
`addHoliday`, `toggleDaySelection`, every `onRehydrateStorage` listener — so awaiting would turn a
synchronous action asynchronous and change its return type. The consequence is that a log lands a microtask
after the action returns, and a log emitted during a teardown may never be flushed. That is the accepted
trade for the bundle: `logging/better-stack/tracking.ts`, which `premium.ts` does import statically, is a
different module with no SDK behind it.

## Gotchas

**`fetchHolidays` and `fetchRegions` do no network I/O.** Both resolve out of the bundled `date-holidays`
dataset in the browser — `getHolidays.ts` is `async` but local, and `getRegions.ts` is outright synchronous.
The names are historical. Nothing in this folder makes an HTTP request except `premium.ts`, which calls
`/api/check-session` through `@ui/adapters/session/checkSession`.

**A Custom Holiday wins the date it lands on.** `fetchHolidays` keeps the existing Custom Holidays, drops any
fetched Holiday sharing a date with one, and re-sorts. `editHoliday` rebuilds through
`holidayDTO.createCustom`, so editing a National or Regional Holiday converts it to a Custom one and it will
survive the next fetch — that is the intended behaviour, not a leak.

**`toggleDaySelection` recomputes metrics but does not re-plan.** It moves a date between
`manuallySelectedDays` and `removedSuggestedDays`, calls `generateMetrics` with the updated sets and writes
the result onto `currentSelection` — leaving `suggestion` and `alternatives` untouched. It returns `false`
without changing anything when the budget is exhausted. Re-planning is a separate worker run.

**`needsSessionCheck` decides when the cookie is consulted, not what is authoritative.** The client-side Premium gate is the persisted `premiumKey` itself ([ADR 0007](../../../docs/adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)); the cookie only seeds it. The premium session is a signed HTTP-only
cookie, not store state ([ADR 0008](../../../docs/adr/0008-premium-derived-from-payment.md)); `premiumKey`
here is a cache of it. `onRehydrateStorage` raises `needsSessionCheck` whenever this device has no fresh
verification — never verified, verified more than `TWENTY_FOUR_HOURS` ago, or nothing decoded — so a valid
cookie restores access without the user retyping their email. `checkExistingSession` is a no-op unless the
flag is up, which is why every consumer can call it unconditionally.

**`premium_activated` fires on the transition into Premium, not on every `setPremiumStatus`.**
`refreshPremiumStatus` re-verifies the stored email on every visit and lands in the same action, so tracking
each call counted one activation per session. The guard is the previous `premiumKey`: no key before, a key
after. `checkExistingSession` restores the same entitlement from the cookie and deliberately emits nothing —
a session restored on a second device is not a second activation.

**Cross-store reads go through `getState()`, not hooks.** `holidays.ts` reads
`useLocationStore.getState().regions` and `useFiltersStore.getState()` inside actions. That is correct
outside React, but it means those reads are not reactive: an action sees whatever was in the other store at
call time.

**Selecting several fields without `useShallow` re-renders on every store write.** Every multi-field consumer
in `src/ui/` wraps its selector in `useShallow`; a new one that forgets is the usual cause of a janky
calendar.

**`crypto.ts` is not a store, and neither file is crypto.** The exports are obfuscation, not encryption, and
`TWENTY_FOUR_HOURS` lives in `utils/crypto.ts` only because `premium.ts` needed it and there was no other
shared constants module. Do not read either file name as a boundary or as a claim.

## Testing

Each store has a co-located `.test.ts` and none of them mounts React. The shared setup is worth copying:
`vi.mock('./crypto')` replaces `obfuscatedStorage` with an in-memory triple so persistence never touches the
real `localStorage`; `vi.mock` on `@infrastructure/clients/logging/better-stack/client` stubs the singleton;
`beforeEach` resets with `useXStore.setState(INITIAL)`. Tests then drive actions through `getState()` and
assert on `getState()`.

**A logging assertion has to wait for the dynamic import.** The `vi.mock` still intercepts it, but the spy
has not been called when the action returns, so the assertion is `await vi.waitFor(() => expect(spy).toHaveBeenCalledWith(…))`.
The spies are hoisted with `vi.hoisted` and handed to the mocked `getBetterStackInstance` so a test can reach
them at all. Several of these tests assert `expect(spy).not.toHaveBeenCalled()` *before* the `waitFor`: that
line is the one that fails if someone converts the import back to a static one, and it is the reason the
assertion is worth its two lines.

Anything the store reaches through `await import(...)` — the two planning entry points, the cache module,
`getHolidays.ts` — is mocked by module path, which is also how `holidays.test.ts` asserts that both cache
clears happen before a run. `generateMetrics` is mocked the same way despite being a static import; the path
is what the mock keys on, not the import style. `crypto.test.ts` is the exception that has to re-import: it uses `vi.resetModules()` with
`vi.stubGlobal('window', …)` and `vi.stubEnv`, because the storage branch is decided once at module load.
