# ui/i18n

## Purpose

UI layer translation message files. Contains only language JSON bundles — routing and locale detection configuration lives in `src/infrastructure/i18n/`.

## Available languages

`en` (default) · `es` · `ca` · `it` · `de` · `fr`

## File structure

Messages are organized by namespace (feature/section). Each namespace maps to a `useTranslations()` scope:

```typescript
const t = useTranslations('sidebar');
t('strategy.optimized.label');
```

## Conventions

- Keys use **camelCase**.
- Text strings are never written in ALL CAPS — if an element must appear uppercase, apply the `uppercase` CSS class in the component.
- Each feature/section has its own namespace to avoid key collisions.
- `en.json` is the reference language — any new key must be added there first.
- Interpolations use `{variable}` syntax and pluralization follows `next-intl` conventions.

## Out of scope

Locale routing configuration (in `src/infrastructure/i18n/`), email template copy (separate system), system or log messages.
