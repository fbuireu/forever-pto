# application

## Purpose
Application layer. Defines data contracts (DTOs), client state (stores), and business workflows (use-cases). It is the bridge between UI and infrastructure — it knows nothing about React components or external SDK details directly.

## Structure

| Folder | Contents |
|---|---|
| `dto/` | Factories that transform raw data into canonical models |
| `stores/` | Global Zustand state with encrypted persistence |
| `use-cases/` | Business flow orchestration using Effect.ts |
| `shared/dto/` | Base type `BaseDTO<INPUT, OUTPUT>` shared by all DTOs |
| `i18n/` | Re-exports of `next-intl` navigation utilities |

## DTO pattern

All DTOs implement `BaseDTO`:

```typescript
type BaseDTO<INPUT, OUTPUT, PARAMS = unknown> = {
  create: (params: { raw: INPUT; params?: PARAMS }) => OUTPUT;
};
```

`create` is the only public interface of each DTO. Do not use `Raw*` types outside this layer.

## Use-case pattern

Use-cases use `Effect.gen()` for sequential composition with typed dependency injection. Dependencies (TursoService, StripeServerService, LoggerService) are injected via Effect context — never instantiated directly.

## Conventions

- DTOs contain no business logic — only data transformation and normalization.
- Stores do not call infrastructure clients directly; they go through services.
- Use-cases are the only place where multiple services are combined in a single transactional flow.

## Out of scope

React components, raw SQL, Stripe SDK calls (use `infrastructure/clients`), presentation logic.
