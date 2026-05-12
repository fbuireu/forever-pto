# stores

## Purpose
Global client-side state using Zustand. All stores persist to encrypted localStorage and act as the single source of truth for UI and calculations.

## Stores and responsibilities

| Store | Owned state |
|---|---|
| `filters` | `ptoDays`, `year`, `country`, `region`, `strategy`, `carryOverMonths`, `allowPastDays` |
| `holidays` | `holidays[]`, `suggestion`, `alternatives[]`, `currentSelection`, `manuallySelectedDays`, `removedSuggestedDays`, `isCalculating` |
| `location` | `countries[]`, `regions[]`, loading flags, `lastFetched` (24h cache) |
| `premium` | `premiumKey`, `userEmail`, `lastVerified`, `currency`, popover flags |
| `crypto` | XOR+base64 encryption utilities; owns no business state |

## Usage patterns

- Always use `useShallow` when selecting multiple fields to prevent unnecessary re-renders.
- `Date` objects are serialized as ISO strings in persist and must be explicitly revived on read — do not assume they are `Date` instances when reading from storage.
- `crypto` uses unencrypted localStorage in dev; in production it applies XOR with `NEXT_PUBLIC_STORAGE_KEY`.
- The premium session expires after 24h — `needsSessionCheck` signals when revalidation is needed.

## Conventions

- Stores do not fetch directly: they delegate to infrastructure services through their actions.
- Each action logs errors to BetterStack before failing silently.
- Types shared across stores live in `types.ts` (`GenerateSuggestionsParams`, `FetchHolidaysParams`, etc.).

## Out of scope

Bridge calculation logic (in `services/calendar`), holiday fetching (in `services/holidays`), React components.
