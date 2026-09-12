# 13. `LoggerService` stays an Effect service tag

Date: 2026-08-17

## Status

Accepted. Amended 2026-09-12: the singleton this ADR names, `getBetterStackInstance()`, is the plain `logger`
export of [`apps/web/src/infrastructure/logging/logger.ts`](../apps/web/src/infrastructure/logging/logger.ts)
now, and the tag's interface is that object's type rather than a second declaration of it. Nothing below
changes: the tag is still the requirement the annotation turns into a compile-time signal, and the module
export is still what runs where there is no layer to provide.

## Context

`LoggerServiceLive` is `Layer.sync(LoggerService, () => logger)`. The tag's interface is
the type of that object; its implementation is one call returning the module export. There is one production
adapter and no second one in prospect, so by the usual rule (one adapter is a hypothetical seam, two is a
real one) it reads as pure ceremony.

The cost is real and spread across the tree. Production modules all over carry `LoggerService` in their `R`:
both payment handlers, the use-cases, `zodParse`, the webhook route, the payments confirmation service and
the Premium activation operation. Every test that reaches one builds a whole-interface `Layer.succeed(LoggerService, { … })`
stub. [`api/operations/activatePremium.ts`](../apps/web/src/infrastructure/api/operations/activatePremium.ts) opens an `Effect.gen` inside its `catchAll` for no reason other
than to `yield*` a logger. And [ADR 0002](./0002-effect-for-external-service-boundaries.md) already places
logging *outside* Effect: BetterStack has both a tag and a plain singleton, and the singleton is what the
stores, the lookups and the components use, so deleting the tag would be that decision carried to
completion rather than a challenge to it.

The clearest symptom that it is not behaving like a boundary: `[locale]/(app)/payment/confirmation/page.tsx`
logs the *same* activation story through the `logger` import while the operation logs it through the
tag. One concern, rival mechanisms, chosen by whether the caller happens to sit inside an `Effect.gen`.

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

`LoggerService` stays a tag, and the modules that need it go on carrying it in `R`.

The rejected alternative is replacing it with the `logger` import everywhere, which
would delete the tag, the Live layer and every stub layer. It is rejected because the guarantee above only
exists while logging is a *requirement*: each `Layer.succeed` block would become a
`vi.mock('@infrastructure/logging/logger')` call, no cheaper, and the compile-time signal would be gone with
nothing to replace it.

**The guarantee is the tag *and* an explicit return-type annotation together.** A use-case whose `R` is
inferred gets nothing from this: the inferred type simply widens to include `LoggerService` and the build
stays green. That is the part worth knowing, because it makes "annotate the return type" load-bearing rather
than stylistic on any Effect program under `@application/use-cases`.

## Consequences

- **A new Effect program that must not log has to declare its return type.** Leaving `R` inferred silently
  permits a logger. The use-cases annotate theirs today; a new one that does not gets no protection and
  looks identical.
- **The tag is not a substitution seam and must not be treated as one.** Providing a stub in a test does not
  silence a module that imports `logger` directly, and several do. See
  [`../apps/web/src/infrastructure/CLAUDE.md`](../apps/web/src/infrastructure/CLAUDE.md).
  A test asserting "nothing logged" is only meaningful for code that reaches the tag.
- **Every test that reaches one pays a whole-interface stub, and that stays.** It is the price of the signal.
  The interface is as small as its callers: `debug` was on it with no caller anywhere, and went, so a stub is
  four methods and each of them is one something reaches.
- **The split between mechanisms at the confirmation page is closed.** The page used to warn through
  the `logger` import on a payment intent that had not succeeded while `confirmation` logged the
  Stripe failure through the tag: one story, rival mechanisms. The warn lives in `confirmation` now, beside the
  `logError` it always sat next to, so the page imports no logger at all and the whole activation story
  reaches `LoggerService`. A page that reaches for the singleton for something its Effect program already
  sees is the regression to watch for.
- This does **not** reopen [ADR 0002](./0002-effect-for-external-service-boundaries.md). Logging remains the
  documented exception to "all external calls go through Effect"; what this records is why the tag survives
  *alongside* the singleton rather than being replaced by it.
