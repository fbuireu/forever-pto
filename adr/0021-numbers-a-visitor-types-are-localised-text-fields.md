# 21. Numbers a visitor types are localised text fields

Date: 2026-10-04

## Status

Accepted.

## Context

The four fields where a visitor types a number (the Donation amount, the accrual calculator's days per month, the
salary calculator's annual salary and unused days) were `<input type="number">`. A number input reads the number by the
browser's rules, not the page's, and measured in Chromium on the Donation amount it misreads every language the app
serves that writes a decimal comma (Spanish, Catalan, Italian, German, French):

- It accepts the point as the decimal mark whatever the language and drops the comma key. `2,5` typed on the Spanish or
  German page read 25, and `30.000`, which is thirty thousand there, read 30.
- It reports an emptied field, and a partial number such as `4.`, as an empty string, so state that converted every
  keystroke wrote `0` over what the visitor was typing. Holding the text as a string and parsing it where it was used
  worked around that and left the first two defects in place.

Reading a localised number needs a text input, and that changes the accessible role from `spinbutton` to `textbox`.
React Aria drops the spin button on purpose, because VoiceOver cannot focus one, and Base UI's `NumberField` does the
same and sets `aria-roledescription` on the text input instead, so the role change is the accepted one. What was weighed:

- **Keep `type="number"`.** It keeps the role and the native spinner, and it keeps both misreads.
- **Force `role="spinbutton"` on a text input.** The pattern then owes `aria-valuenow` and the rest, and VoiceOver
  stops being able to focus it.
- **Parse with `Intl` in a hand-written field.** It rebuilds what `NumberField` already does: caret, paste, arrow-key
  stepping, Home and End, the bounds.
- **`NumberField` as it ships.** It parses with a locale, which fixes `30.000`, but it removes the group mark wherever
  it sits. On the Spanish page `2.5` reads 25 and `2.50` reads 250, which `type="number"` read correctly, and a donation
  field would charge ten or a hundred times what was typed.

## Decision

A number the visitor types is a `NumberInput` ([`core/primitives/NumberInput.tsx`](../apps/web/src/ui/modules/core/primitives/NumberInput.tsx)),
Base UI's `NumberField` drawn with the app's `Input` (or the group's `InputGroupInput`), and never `type="number"`; the
contract suite fails the latter.

- It is a text field with the caller's `inputMode`, a translated `aria-roledescription` (`a11y.numberField`, supplied by
  the caller because `core/` renders no copy), the route's locale from `useLocale()` so the server and the browser
  format the same text, and no increment or decrement buttons.
- The number is read by `readLocalizedNumber` ([`ui/utils/localizedNumber.ts`](../apps/web/src/ui/utils/localizedNumber.ts)):
  the language's own group and decimal marks first, then one rule for a mark of the other language. A lone mark that is
  not followed by exactly three digits cannot be a group mark, so it is a decimal point: `2.5` and `2,5` are two and a
  half on every page, `2.50` is two and a half, and `1.234` is 1,234 in Spanish and 1.234 in English. Text that fits
  neither rule (`1.2.3`, a lone `.`) reads as nothing.
- State holds `number | null`, `null` for a field that is empty or whose text cannot be read, and the owner converts it
  where it is used. The Donation schema reads it as 0, so an empty submit and an unreadable one fail on the same message,
  the minimum's own, as an emptied number input did; the calculators read it as no days or no figures. Text that cannot
  be read is cleared when the field is left.
- A typed value is not clamped (`allowOutOfRange`), as a number input never clamped it, so the schema says a donation is
  too low or too high; stepping with the arrow keys, Home and End clamps to `min` and `max` and snaps to `step`.

## Consequences

- Load-bearing in `NumberInput`: it reports the reading of the field's settled text instead of the number Base UI
  parsed, and it vetoes, when the field is left, the number Base UI would write over what was typed. Remove either and
  `2.5` on the Spanish page is 25 again. The tests that pin them type each separator in English, Spanish and German.
- The role is `textbox`, so a screen reader no longer announces a value range, and Chromium's hover spinner is gone.
  Neither field had visible step buttons, so nothing is drawn differently besides that glyph.
- A Base UI upgrade that changes how `NumberField` parses, formats on blur or reports a change needs the
  `NumberInput` tests read again before it lands.
- Where it bites in the rest of the docs: `U15` in [`CODING_STANDARDS.md`](../CODING_STANDARDS.md), the Donation form
  paragraph of [`application/dto/AGENTS.md`](../apps/web/src/application/dto/AGENTS.md) (the form holds `amount` as
  `number | null`) and the `NumberInput` entry of [`ui/modules/core/AGENTS.md`](../apps/web/src/ui/modules/core/AGENTS.md).
