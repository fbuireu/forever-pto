# core

## Purpose

Project design system. Provides base primitives, animated variants, and reusable effects. Single source of truth for design tokens, component variants, and interactive behavior.

## Structure

| Folder | Contents |
| --- | --- |
| `primitives/` | Stateless base components (Button, Card, Input, Dialog, Table, Badge…) |
| `animate/base/` | Framer Motion–enhanced versions of Radix primitives (Accordion, Popover, Sidebar…) |
| `animate/components/` | Rich animated compositions (Counter, Tabs, FeatureList, RadialNav) |
| `animate/effects/` | Reusable motion effects (AutoHeight, MotionHighlight) |
| `animate/icons/` | 30+ animated SVG icons via `AnimateIcon` wrapper |
| `animate/text/` | Text animations (SlidingNumber, Rotating, Gradient) |
| `animate/providers/` | `LazyMotionProvider` — lazy loading of the Framer Motion bundle |

## Conventions

- All primitives use **CVA** (`class-variance-authority`) for variant management — always export the CVA object alongside the component (`buttonVariants`, etc.).
- Use **Radix UI** for accessibility; Framer Motion is only for the visual layer on top.
- `data-slot` attributes on composition sub-components (Card, Form…) for CSS containment hooks.
- `asChild` pattern via Radix `Slot` in Button and similar — do not reinvent.
- Design tokens: 3px borders, `shadow-brutal-*`, CSS variables `--frame`, `--color-brand-*`.
- No `default export` — named exports only for better tree-shaking and autocomplete.

## Out of scope

Business logic or store access, translation keys (components accept strings, they do not call `useTranslations`), page layouts or section structures, API calls or data fetching.
