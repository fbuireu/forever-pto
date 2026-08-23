# 13. `LoggerService` stays an Effect service tag

Date: 2026-08-17

## Status

Accepted.

## Context

`LoggerServiceLive` is `Layer.sync(LoggerService, () => getBetterStackInstance())`. The tag's interface is
five method signatures; its implementation is one call returning the module singleton. There is one production
adapter and no second one in prospect, so by the usual rule — one adapter is a hypothetical seam, two is a
real one — it reads as pure ceremony.

The cost is real and spread across the tree. Eleven production modules carry `LoggerService` in their `R`:
both payment handlers, four use-cases, `zodParse`, the webhook route, the payments confirmation service and
the Premium activation operation. Twelve test files build a five-method `Layer.succeed(LoggerService, { … })`
stub. [`api/operations/activatePremium.ts`](../apps/web/src/infrastructure/api/operations/activatePremium.ts) opens an `Effect.gen` inside its `catchAll` for no reason other
than to `yield*` a logger. And [ADR 0002](./0002-effect-for-external-service-boundaries.md) already places
logging *outside* Effect — BetterStack has both a tag and a plain singleton, and the singleton is what the
stores, the lookups and the components use — so deleting the tag would be that decision carried to
completion rather than a challenge to it.

The clearest symptom that it is not behaving like a boundary: `[locale]/(app)/payment/confirmation/page.tsx`
logs the *same* activation story through `getBetterStackInstance()` while the operation logs it through the
tag. One concern, two mechanisms, chosen by whether the caller happens to sit inside an `Effect.gen`.

Against all that, the tag buys one property, and it was verified rather than assumed. `activateWithEmail`
declares its return type explicitly, `TursoService` and nothing else. Adding a `yield* LoggerService` to its
body fails the build at the function itself:

```
Type 'Effect<…, …, TursoService | LoggerService>' is not assignable to
type 'Effect<…, …, TursoService>'
```

A singleton call cannot do that, because it is not a requirement and so never appears in a type. So `R`
answers "does this program log?", and an explicit annotation turns an unintended log into a compile error at
the place it was introduced.

## Decision

`LoggerService` stays a tag, and the eleven modules go on carrying it in `R`.

The rejected alternative is replacing it with the `getBetterStackInstance()` singleton everywhere, which
would delete the tag, the Live layer and twelve stub layers. It is rejected because the guarantee above only
exists while logging is a *requirement*: the twelve `Layer.succeed` blocks would become twelve
`vi.mock('…/better-stack/client')` calls — no cheaper — and the compile-time signal would be gone with
nothing to replace it.

**The guarantee is the tag *and* an explicit return-type annotation together.** A use-case whose `R` is
inferred gets nothing from this: the inferred type simply widens to include `LoggerService` and the build
stays green. That is the part worth knowing, because it makes "annotate the return type" load-bearing rather
than stylistic on any Effect program under `@application/use-cases`.

## Consequences

- **A new Effect program that must not log has to declare its return type.** Leaving `R` inferred silently
  permits a logger. The four use-cases annotate theirs today; a fifth that does not gets no protection and
  looks identical.
- **The tag is not a substitution seam and must not be treated as one.** Providing a stub in a test does not
  silence a module that calls `getBetterStackInstance()` directly, and several do — see
  [`../apps/web/src/infrastructure/clients/CLAUDE.md`](../apps/web/src/infrastructure/clients/CLAUDE.md).
  A test asserting "nothing logged" is only meaningful for code that reaches the tag.
- **Twelve test files pay a five-method stub, and that stays.** It is the price of the signal. Shrinking the
  tag's interface would reduce it, but every method has a caller.
- **The two-mechanism split at the confirmation page is left standing.** It is on the wrong side of this
  decision and is cheap to fix by routing that page through the operation; it has not been, and it is the
  regression to watch for rather than an example to copy.
- This does **not** reopen [ADR 0002](./0002-effect-for-external-service-boundaries.md). Logging remains the
  documented exception to "all external calls go through Effect"; what this records is why the tag survives
  *alongside* the singleton rather than being replaced by it.
