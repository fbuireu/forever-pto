# Accessibility

Forever PTO is a holiday planner at [forever-pto.com](https://forever-pto.com), documented at
[docs.forever-pto.com](https://docs.forever-pto.com). Both should work with a keyboard alone, with a screen
reader, at high zoom and with reduced motion. This page says what the code does toward that, what is and is not
tested, how to report a barrier, and what a pull request has to keep working.

## What the planner does

- **A skip link.** The first Tab stop on every page jumps past the header to the main content.
- **A name on every control.** The shared components take their accessible name as a prop, and the prop is
  required wherever the control would otherwise have none, such as the slider and the information tooltips.
  Every form label points at the field it names.
- **Keyboard patterns from Base UI.** Dialogs, menus, tabs, sliders and the other widgets are built on
  [Base UI](https://base-ui.com) primitives, which carry the keyboard model of their ARIA pattern. The code
  declares an ARIA role only together with that whole pattern.
- **Visible focus.** Wherever the browser's focus outline is removed, a focus style of the component's own
  replaces it.
- **Spoken status.** Screen readers hear when the plan is recalculating and when it is ready, how many PTO days are
  still unassigned, and when there is no plan to show. A number shown twice on screen is announced from one place,
  so it is read once.
- **Six languages.** The planner, and everything a screen reader announces in it, is in Catalan, English, French,
  German, Italian and Spanish, and each page declares its language.
- **Contrast checked by a test.** A unit test measures the text on the calendar's coloured days and on every
  banner's tinted background, in both themes, and fails below a 4.5:1 contrast ratio.
- **Less motion.** Animations follow your system's reduce-motion setting.

The documentation site is built with [Starlight](https://starlight.astro.build), which provides its skip link,
landmarks and search dialog. Each component page there has an Accessibility section saying what Base UI wires up
and what the code using the component has to add.

## What is tested

- End-to-end tests run on every pull request in desktop Chromium and desktop WebKit, the engine behind Safari.
  Phones and tablets are not part of these runs.
- No screen reader, voice control or switch access is tested on a schedule, and no automated accessibility scan
  runs in CI. Reports from people who use them are the main way barriers there come to light.
- The planner has not been audited against WCAG, so this page makes no conformance claim.

## Known barriers

Barriers already found are tracked as
[open issues with the `accessibility` label](https://github.com/fbuireu/forever-pto/issues?q=is%3Aissue%20state%3Aopen%20label%3Aaccessibility).

## Reporting a barrier

If part of the planner or the docs is hard or impossible for you to use,
[open a bug report](https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml). Without a GitHub
account, use *Contact us* in the planner's footer and say the message is about accessibility. You don't need to
say anything about a disability.

Include as much of this as you can:

- What you were trying to do, and what happened instead.
- The page URL.
- Your browser, operating system and device, in the form's *Browser and OS* field.
- Any assistive technology you use, such as a screen reader, magnifier or voice control, and its version. It goes
  in the same field.
- Settings that change how pages look or move: zoom or text size, high contrast or forced colours, dark mode,
  reduced motion.
- For the planner, the country, region, year and PTO budget you had selected, since the calendar depends on them.
- A screenshot or recording, if you're comfortable sharing one.

### What happens next

- The issue gets the `accessibility` label, so it joins the list above.
- Questions about missing details, and a workaround when there is one, come in the issue.
- No date is promised for a fix. The fix links the issue, which closes when it ships.

## For contributors

A change to the planner or the docs keeps the above working:

- Follow the [accessibility rules](../CODING_STANDARDS.md#accessibility) in `CODING_STANDARDS.md`, `X1` to
  `X8`.
- Put text that only a screen reader hears in the `a11y` message namespace, in all six locale bundles (`L4`).
- Before opening a pull request that changes the UI, use it with the keyboard alone: every control reachable with
  Tab, operable with Enter, Space or the arrow keys its pattern expects, focus visible throughout, and a way out of
  every dialog and menu.
- When a component's name, role or keyboard behaviour changes, update the Accessibility section of its page in the
  docs.
- If a change adds a barrier it cannot avoid, say so in the pull request and open an issue with the
  `accessibility` label.

## Ownership

[Ferran Buireu](https://github.com/fbuireu) maintains the planner, the docs and this page. The page changes in the
same commit as the behaviour it describes.

## Feedback on this page

If something here is wrong, unclear or missing,
[open a documentation issue](https://github.com/fbuireu/forever-pto/issues/new?template=documentation.yml). To
report a barrier in the planner or the docs, see [Reporting a barrier](#reporting-a-barrier).
