# stores

## Purpose

Global client-side state using Zustand. All stores except `ui` persist to encrypted localStorage and act as the single source of truth for UI and calculations.

## Stores and responsibilities

| Store | Owned state |
| --- | --- |
| `filters` | `ptoDays`, `year` (number), `country`, `region`, `strategy`, `carryOverMonths`, `allowPastDays` |
| `holidays` | `holidays[]`, `suggestion`, `alternatives[]`, `currentSelection`, `manuallySelectedDays`, `removedSuggestedDays`, `isCalculating` |
| `location` | `countries[]`, `regions[]`, `regionsLoading`, `countriesLoading`, `countriesLastFetched` (24h cache) |
| `premium` | `premiumKey`, `userEmail`, `lastVerified`, `needsSessionCheck`, modal state |
| `ui` | `donatePopoverOpen`, `donatePopoverIsOpening`, `currency`, `currencySymbol` — non-persisted UI state |
| `crypto` | XOR+base64 encryption utilities; owns no business state |

## Usage patterns

- Always use `useShallow` when selecting multiple fields to prevent unnecessary re-renders.
- `Date` objects are serialized as ISO strings in persist and must be explicitly revived on read — do not assume they are `Date` instances when reading from storage.
- `crypto` uses unencrypted localStorage in dev or when `NEXT_PUBLIC_STORAGE_KEY` is missing; in production it applies XOR encryption.
- The premium session expires after 24h — `needsSessionCheck` signals when revalidation is needed.
- `ui` store is not persisted; state resets on page load.

## Conventions

- Stores do not fetch directly: they delegate to infrastructure services through their actions.
- Session checks (`/api/check-session`) are handled by `@ui/adapters/session/checkSession`.
- Each action logs errors to BetterStack before failing silently.
- Types shared across stores live in `types.ts` (`GenerateSuggestionsParams`, `FetchHolidaysParams`, etc.).
- Shared store constants (`TWENTY_FOUR_HOURS`) live in `utils.ts` alongside crypto utilities.

## Out of scope

Bridge calculation logic (in `services/calendar`), holiday fetching (in `services/holidays`), React components.
