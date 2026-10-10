# Coding standards

What a review checks a diff against. The words are the ones [GLOSSARY.md](./GLOSSARY.md) defines, the reasons are in
[adr/](./adr/), and what an implementer needs while working is in the `AGENTS.md` guides.

**hard** marks a rule whose breach is a defect: report it with the rule. **judgement** marks a call the reviewer
weighs against the diff: report it as a question. A rule here outranks the smell baseline; where it endorses
something a smell would flag, the case is listed under *Deliberate overrides of the smell baseline* at the end.

Every rule carries an id, and a finding cites it with this file: `CODING_STANDARDS.md A3`. A rule applies to
`apps/web` unless its section names `apps/docs`; `N1` applies to both. A rule marked *check pending* is mechanical,
and it leaves this body in the commit that lands its check. The process around a change (commit types, one package
per pull request) is [CONTRIBUTING.md](./.github/CONTRIBUTING.md)'s.

## Tooling already enforces

No rule below restates these, and a diff that breaks one fails CI:

- Biome ([`biome.json`](./biome.json)) over both packages: formatting, import order, the recommended rules,
  `noConsole` everywhere but [`logger.ts`](./apps/web/src/infrastructure/logging/logger.ts), no barrel or `export *`
  module, and no default export outside the Next file conventions, the `next-intl` request config, the Playwright
  global setup and the tools' config files.
- Strict `tsc` over the root program and `apps/web` ([`apps/web/tsconfig.json`](./apps/web/tsconfig.json)), and
  `astro check` over `apps/docs`, which types every demo against the app's real props.
- commitlint ([`commitlint.config.ts`](./commitlint.config.ts)): the commit format, on the commit and on the pull
  request title.
- The coverage floor ([`apps/web/vitest.config.ts`](./apps/web/vitest.config.ts)).
- The guard tests beside the code: no currency glyph in the catalogue (`currencies.test.ts`), one `SidebarProvider`
  (`Sidebar.test.tsx`), a landmark for the skip link on every shell (`SkipToContent.test.tsx`), the tutorial anchors
  (`anchors.test.ts`), one catalogue on the global error page (`global-error.test.tsx`), the heavy modules
  `clientLog.ts`, `location.ts`, `CalendarExport.tsx` and `checkSession.ts` reach only through `import()`, client code
  reading only the namespaces the client is sent (`clientMessages.test.ts`), the dialog popup's height cap
  (`Dialog.test.tsx`), the overlay layers (`Popover.test.tsx`, `Tooltip.test.tsx`), `BLOCK_MINIMUM` as the lowest
  floor any Strategy applies (`utils/helpers.test.ts`), what each Strategy means over a real calendar
  (`strategies.test.ts`), a new obfuscation writing what the old one wrote (`utils/crypto.test.ts`), the ink on every
  brand-filled calendar day at AA in both themes (`contrast.test.ts`), the theme written to `<html>` as `data-theme` and
  as the class a skeleton reads (`AppThemeProvider.document.test.tsx`), one button in the sidebar group whichever way
  its icon arrives (`SidebarCollapsibleGroup.test.tsx`), an animated icon that asks its controls for nothing while it is
  unmounted (`Icon.mounted.test.tsx`) and `premium_activated` reported from the activation redirect alone
  (`PremiumSessionSync.activation.test.tsx`).
- `pnpm test:docs` ([`tests/docs-consistency.test.ts`](./tests/docs-consistency.test.ts)), which holds every document
  to the claims it can check and holds the code to these:
  - no comment in hand-written source (the TypeScript of both packages, this suite and the root configs, the Astro
    files, every stylesheet, the Workers' `wrangler.toml`, the `.env.example` and `_headers` files, the Husky hooks and
    the shell of a workflow step), doc comments included, bar the tool directives `biome-ignore`, `@ts-expect-error`,
    `/// <reference>` and `@vitest-environment`, and a generated file's banner;
  - every `'use client'`, `'use server'` and `'use cache'` in either package a bare string literal in first position;
  - the layer graph the architecture overview publishes equal to the one the imports make, no `Raw*` shape past the
    DTO seam, and `infrastructure` reaching `src/ui` only through the two readers of the locale bundles;
  - in `apps/web/src`, an import that leaves its folder written with the alias and one that stays inside it written
    relative (a folder takes in its subfolders, except at the root of `src` and of a layer, and a screen under
    `ui/modules/pages` and a row of the `ui/modules` table each count as one folder), so an alias always marks a
    crossed boundary; mixing both forms for one module breaks Biome's import sorting;
  - the domain: `calendar/` and `payment/` importing nothing from each other, tests included, `calendar/` importing
    from outside itself only the Holiday DTO types, the date helpers, `temporal-polyfill` and the `next-intl` `Locale`
    type, and Stripe reaching `payment/` only as `import type` in the event factory;
  - the application layer: no `next/server`, `next/headers`, `@opennextjs/cloudflare` or SDK package, no SDK
    constructed, no component but the email template, `stores/premium.ts` the one module reaching `src/ui`, and the
    planning pipeline, `getHolidays` and `getRegions` reached from the stores through `import()` alone;
  - the outward-facing code: the Turso driver inside its client, every statement an `all` or a `run` inside
    `withConnection`, no `next-intl/server` in a route handler or anything it reaches, Country detection fetching only
    through `noStoreFetch`, a JSON body read only by `parseJsonBody` and raw text only by the Stripe webhook, a
    page's `searchParams` typed as the record Next hands over (a repeated parameter is an array), every page's
    metadata one `routeMetadata` line with no metadata module beside it, and no `'use cache'` or `cacheComponents`;
  - the UI: `Link`, `useRouter` and `usePathname` taken from `@application/i18n/navigation`, no `'use server'` or
    `next/headers` in `src/ui`, no `type="number"` input (`NumberInput` reads the visitor's own separators), `core/`
    free of stores, translations and fetching, `core/animate/primitives` imported
    only inside `core/animate` (the docs site included), `m` from `motion/react` rather than `motion` or
    `framer-motion`, every `<Skeleton>` fixture repeated as its fallback, no `max-h` or `overflow` on a
    `DialogContent`, `focus:outline-none` only on the programmatically focused drawer panel, and no `track()` inside
    an effect but the view a `#contact` link opens;
  - the colours: in the TypeScript and CSS of `apps/web/src`, no hex, no colour function (`rgb()`, `oklch()`...), no
    palette class (`bg-red-500`, `text-black/50`, `border-white`), no `white` or `black` and no CSS colour keyword
    outside the token modules, `ui/styles/global/index.css`, `ui/styles/theme/index.css`, `ui/styles/palette.ts` and
    `application/email/palette.ts`, with no exception for a consumer that cannot read a custom property or for
    generated code; a test may pin a resolved value;
  - the custom properties: every `var(--x)` read in `apps/web/src`, by a class, a stylesheet or a style key, declared by
    a stylesheet outside `@theme inline`, a style key, an arbitrary property, `setProperty`, a font's `variable`, a Base
    UI `CssVars` module or Tailwind's default theme, except that a CSS module counts none of Tailwind's on-demand
    theme (its default and a plain `@theme` block) and reads what an `@theme static` block or a token declares;
  - the shipped stylesheet: built with Tailwind's own compiler and scanner from `index.css`, it scans no test, no
    end-to-end spec and no Markdown and emits no palette utility;
  - the code at large: `Temporal` from `temporal-polyfill`, Stripe.js imported through `@stripe/stripe-js/pure` and
    asked for only inside a function (the bare entry injects the script on import and writes a failed load to the
    console, and a module-scope ask runs outside the effect that answers its failure), no
    `index` module, one argument passed positionally and two or more as one object in `apps/web`, its tests, its e2e
    specs and this suite (no declared function or `const` arrow taking two positional parameters, a route's HTTP
    method handlers aside, and no `…Params` type, nor inline parameter type of a function that takes no props, with a
    single field of its own), no number in the planning engine but 0, 1 and a percentage's `* 100` outside `const.ts`
    and `window.ts`, a date format built in `dates.ts` alone, a Holiday's `isInPlanningWindow` read in
    `dto/holiday/rules.ts` alone, every `json()` answer bound as `unknown`, never cast or typed, and every
    module-level schema named `<concept>Schema`;
  - the tests: a `route.test.ts` beside every route handler, no `__tests__` folder, no fixture shaped like a Stripe
    client secret, no fixture day built from a date-only ISO string, no DTO module mocked in a unit test, no year read
    off the real clock and no `Date.now()` bracket in a unit test, no test writing the process environment, every
    `vi.stubGlobal`, `vi.stubEnv`, `vi.spyOn` and `vi.useFakeTimers` in a test file undone by `vi.unstubAllGlobals()`,
    `vi.unstubAllEnvs()`, `vi.restoreAllMocks()` (or the spy's `mockRestore()`) or `vi.useRealTimers()` in an
    `afterEach` or `afterAll`, or in a `finally` around it, and a schema's answer asserted with `validate`, with
    `safeParse` only in a case that reads the issue;
  - `succeeded` compared as one value in the payments SQL, spelled by no other production module, and
    `PAYMENT_STATUSES` equal to the statuses the installed Stripe SDK knows;
  - the locale bundles holding exactly `en.json`'s keys, every key in camelCase but the machine codes and every value
    a string, shouting nothing outside the acronym list, addressing the user informally in German and French, styling
    no number, date or time argument (`{n, number, percent}`), and naming no concept by a phrase the glossary retires
    ("days off", "unused days", "manually selected" and their translations, one list per bundle) outside the marketing
    namespaces and the legal texts;
  - the configuration: `strict` on and `allowJs` off, `cloudflare-env.d.ts` out of the program and out of git,
    `PUBLIC_ENV` classifying exactly the `NEXT_PUBLIC_*` names `environment.d.ts` declares and each wired where it is
    read, the security headers with the sources Stripe.js asks of the CSP, `immutable` on `/_next/static`, every
    binding in every wrangler environment, the TypeScript pins, and the production build stripping every `console`
    call but the logger's levels (`removeConsole` excluding exactly `LOG_LEVEL`'s values), because the logger's lines
    reach Better Stack only as console output and a stray `console.log` must never ship;
  - the workflows: no deploy, build or secret write in a retry wrapper, every deploy's `--message` the one token
    `<sha>-<event>` the deploying repositories share (`C6`), only scripts a manifest declares, the preview cleanup
    queued behind the run that deployed it, every gated job under a `Check` aggregate, release configs that parse the
    commit grammar commitlint accepts, the toolchain set up through `prepare-env` alone and installed unfiltered, a
    `working-directory` on the step rather than in a `defaults` block, no flag forwarded after `pnpm run <script> --`,
    and every `uses:` of another repository pinned to a full commit SHA with its version or branch in a trailing
    comment;
  - Playwright running the `chromium` and `webkit` projects alone in both packages, in CI and locally alike, and every
    workflow job that runs it installing both browsers behind a cache keyed on them;
  - the YAML, every file of it: no comment but a SHA pin's trailing comment, a tool directive and the line Renovate
    writes into `pnpm-workspace.yaml`, a `#` counting as a comment when removing it leaves the parsed document
    unchanged;
  - the package scripts: no shell substitution, and a literal base on every changed-only Vitest or Playwright run;
  - the documents: no `BACKLOG.md` anywhere in the tree and no `Known inconsistencies`, `Known defects` or
    `Known breaches` heading in any of them (`G9`);
  - the published wiki: canonical glossary terms outside its landing pages, repo-relative paths, only constants,
    tokens, icons and `@ui` exports that exist, and no history in the prose (`used to`, `no longer`, `previously`,
    `any more`, `until now`, a dated event), outside code and quotes;
  - the docs site: every component page's sections in order after its demos and the Live badge on it, every sidebar
    group translated into each locale the site serves, the app's styles brought in through `global.css` and never
    the app's own `index.css`, the consent category and service ids equal to the app's, the consent banner in each
    locale the site serves with the app's words for the answers the two share, and every Mermaid diagram
    held to the `layout: dagre` it was drawn with, which the renderer sets for the whole site and no fence
    overrides, so a renderer that defaults to ELK cannot redraw it.

## Every change

- `G0` **hard**: A change carries everything the maintenance contract in [AGENTS.md](./AGENTS.md) and the guide of
  each folder it touches ask of it, in the same commit, and keeps every guardrail those guides state: the `logging/`
  files in step with the sibling repositories, the block `next dev` rewrites in `apps/web/AGENTS.md` left byte for
  byte, Next and `@opennextjs/cloudflare` moved as a pair. A follow-up commit is a promise, not a fix.

## Naming and vocabulary

- `N1` **hard**: Name identifiers, product copy and docs with the glossary's canonical term; a retired `_Avoid_` name
  lets rival numbers share a word, so it is a defect even on a symbol nothing calls
  ([ADR 0014](./adr/0014-ddd-where-it-pays.md)). The glossary binds code, documents and product copy; marketing copy,
  which is the homepage with its sections and the docs site's landing pages, may use the words people search for
  ("days off", "free days", "vacation plan"). In the bundles that means `homepage`, `faq`, `quickStart`,
  `troubleshooting` and `metadata`; every other namespace, bar the four legal texts, is product copy.
- `N2` **hard**: Call a public non-working day `Holiday` in code and docs; "public holiday" belongs only in English
  user-facing copy, where the bare word would read as vacation.
- `N3` **hard**: Keep the Holiday Variant in `variant`; `type` is the upstream classification's field and means
  something else.
- `N4` **judgement**: Leave a retired term inside a message key or an analytics event id when renaming it costs a
  change across every bundle or splits a funnel; the text the user reads still uses the canonical word.
- `N5` **hard**: Name persisted-state helpers for obfuscation (`obfuscate`, `obfuscatedStorage`), because the key
  ships in the bundle ([ADR 0007](./adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)).
- `N6` **hard**: Put the filter a query applies in its name (`getSucceededPaymentByEmail`), so no caller re-checks
  what the `WHERE` already decided.
- `N7` **judgement**: Give a module's main export the file's name, or name the file after the concept and the export
  after the action on it (`charge.ts` → `retrieveCharge`); with no barrels, the import path is the only index.

## Modelling and types

- `M1` **judgement**: Before a concept gets a type of its own, ask in order whether the illegal state can be
  reached, whether anything reads it and whether it crosses a boundary; the first no means writing the rule down (an
  assertion, a guide line, an ADR) instead of encoding it, and three yeses let a type be proposed, never require one
  ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- `M2` **hard**: Narrow a sealed union or a bounded shape where it crosses an untrusted boundary (persisted state,
  the worker wire, a query string) with its own predicate, once (`isStrategy`, `isHolidayVariant`,
  `isPreferredMonths`); a value that fails it takes the default or is dropped, never guessed, and the rest of that
  wire stays typed ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- `M3` **hard**: Make a wrong call unrepresentable: a value the caller holds and could lose in silence behind a
  plausible default (the Metrics' Holidays in `generateMetrics`) is a required parameter, and a check one caller owes
  is a required parameter of that caller's own entry point. An optional parameter with a neutral default
  (`preferredMonths?`, `removedDays?`) is fine.
- `M4` **hard**: Pass the one value that holds what must agree (`PlanningWindow`, a Suggestion with its Bridges)
  rather than parts a caller could send out of step.
- `M5` **judgement**: Put what the producer guarantees into the type (`MeasuredSuggestion`), so a regression is a
  compile error rather than a silent zero behind an optional chain.
- `M6` **hard**: Narrow a discriminated union with its `switch` and read the payload the compiler already typed; a
  cast on the narrowed payload hides a relabelled case.
- `M7` **hard**: Cast a stored or wire shape to a live one once, by name, at the seam (`Stored<T>` in
  `dateIntake.ts`), so every type downstream tells the truth.
- `M8` **hard**: Declare an exhaustive map over a union with `satisfies Record<Union, …>`, or with a
  `Record<Union, …>` annotation when no literal types are needed (`STRATEGY_OBJECTIVE`), and a literal table whose
  literal types feed a typed API as `as const satisfies`, so a missing or mistyped key fails to compile.
- `M9` **hard**: Declare a list whose members become a type (`LOCALES`) `as const`, or the derived type widens to
  `string`.
- `M10` **judgement**: Narrow a field only where the value is proved: a `TEXT` column read back stays `string`, and
  a mirror of an open upstream enum is widened, not closed ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- `M11` **hard**: Declare in a component's props only what it honours or forwards, so a prop a caller passes is
  never dropped in silence; a prop read only when the component mounts is named `initial…` (`initialMonth`), or
  `default…` where it mirrors a primitive's own prop (`defaultOpen`), and props that exclude each other are a union on
  the prop that decides (`MetricCard`'s `size`).
- `M12` **hard**: Annotate a factory with the interface it produces, so a dropped field fails at the factory rather
  than at a call site in another layer.
- `M13` **judgement**: Pin a type claim with a type (`MetricsHoldNoDate`, a `@ts-expect-error` case in the test)
  rather than with a round-trip test that cannot see it.
- `M14` **hard**: Narrow on the value about to be used (`isFromToObject`); an `in` check proves only that the key
  exists.
- `M15` **hard**: Declare an enumeration the code compares against as an `as const` object with a type of the same
  name, `(typeof X)[keyof typeof X]` (`CalendarSelectionMode`, `HolidayFormMode`, `DRAWER_SNAP`); a prop's literal
  union (`side`, `variant`) stays a union.
- `M16` **hard**: Read a value whose shape the types cannot prove (what arrives over HTTP: a `fetch` answer, a page's
  `searchParams`, a server action's error code) as `unknown` and check it with a zod schema before reading any field
  of it, never with a cast, because a cast checks nothing at run time and a malformed value then fails far from its
  source: through a cast, a malformed answer becomes a wrong outcome rather than the *no* its caller's guide records,
  and a malformed `/api/check-session` 200 reads as *no session* and revokes a donor's Premium. Name the schema
  `<concept>Schema` after what it checks, declare it beside its one reader (in `application/dto/*/schema.ts` when
  several read it or it checks a query string or a body this app's own endpoint answers), and infer the type from
  it; check with `validate` where the answer is a yes or no, and with `zodParse` where the caller reads the parsed
  value or the issue. `zodParse` hands the first issue to the response as a `ValidationError`. A lookup that must
  keep zod out of its bundle narrows through a `typeof` picker instead (`stringField`), `parseJsonBody`'s type
  argument only names what the use case's `zodParse` checks, and `M7`'s cast is for a shape this app wrote itself.

## Functions and modules

- `F1` **hard**: Pass one argument positionally and two or more as one object, so argument order carries no meaning and
  no `…Params` type or inline parameter type declares a single field of its own, because a wrapper around one value adds
  a type and a destructure for nothing. The contract suite reads a declared function or a `const` arrow; a class or
  object method follows the rule too, which the suite does not read. Name a parameter object after the function that
  takes it, `<FunctionName>Params`, so a reader landing on the type finds what takes it; a function handed one record
  keeps that record's type. Sibling functions that take the same input may share one type named for that role
  (`DatePairParams`, `ObfuscationParams`), and a component takes its props as one object whatever their number, which
  is React's contract (`…Props`). Only a signature a runtime owns (a route handler, a page's props, a `.sort()`
  comparator, a library's callback) stays as its owner wrote it, and a rest list of one kind (`cn(...inputs)`) counts as
  one parameter. A test helper follows the same rule.
- `F5` **hard**: Add a parameter, a cache key, an interface method or a service-tag method in the same change as its
  first caller, and remove it with its last; a demo in `apps/docs` that renders the component counts as a caller.
- `F6` **judgement**: Implement a guarantee once and call it from every site that needs it (chronological order in
  `selectBridges`, occupancy in `heldOn`, the budget in `measureBudget`, the Alternative ceiling in
  `generateAlternatives`, the Preferred Months test in `inPreferredMonths`), because a second copy drifts with
  nothing to catch it, and a caller that re-applies it hides where the guarantee lives.
- `F8` **judgement**: Keep a refactor free of behaviour and pixel changes; a visual or behaviour change is its own
  commit.
- `F10` **judgement**: Name every tunable number of a hook or a utility as a module-level constant (the tour's frame
  counts in `useTutorial.tsx`, the breakpoint in `useMobile.ts`), so a reader finds what to tune without reading the
  logic.

## Errors and logging

- `E1` **hard**: Write a server path that talks to Stripe, Turso or Resend as an Effect program with a typed error
  channel and service tags; code that only transforms data stays plain TypeScript
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `E2` **hard**: Map every SDK rejection to the method's tagged error (`DatabaseError`, `EmailError`,
  `PaymentError`), chosen when the method is added and keeping the original in `cause`; the error channel never
  carries a raw SDK exception, and `failureContext` keeps `cause` out of the log
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `E3` **hard**: Refine a failure with a subclass that keeps the parent's `_tag` (`SessionConfigurationError`); a
  sub-case that needs its own status gets its own tag and its own row in `describeFailure`
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `E4` **hard**: Absorb a failure only where the substitute is an answer the flow could genuinely have got; a
  database failure on the critical path propagates.
- `E5` **hard**: Keep `ValidationError` for conditions the code decides itself; its message reaches the client
  verbatim, so an infrastructure failure keeps its own tag.
- `E6` **hard**: Return the writes a response does not depend on as a `deferred` Effect with `never` in its error
  channel and `TursoService` alone in its requirements, run in `after()` with the layer provided again.
- `E7` **judgement**: Pick log severity by backstop: `warn` for a refusal the payer caused or a deferred write the
  Stripe webhook can repair, `error` for Stripe, session and database failures and for a write nothing backs up.
- `E8` **hard**: Log an address as `emailDomain(email)` from `redact.ts`, never the address itself.
- `E9` **hard**: Put a URL in a log context only under `url`, which the logger strips of its query string, so
  `payment_intent_client_secret` never reaches the sink.
- `E10` **hard**: Log from stores and components through `logClient` or `logClientError`, from the lookups under
  `infrastructure/services` through the `logger` import, and through `LoggerService` only where a layer is provided
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md),
  [ADR 0013](./adr/0013-loggerservice-stays-a-tag.md)).
- `E11` **judgement**: Log a failure's own enumerable fields (`failureContext`) rather than an assumed `message`.
- `E12` **judgement**: Attach an error-path log in `Effect.sync` inside a `tapError` on the step it names; a log on a
  successful branch is a plain statement, and `Effect.sync` adds no safety.

## Domain (`apps/web/src/domain`)

- `D3` **hard**: Compose `payment/` directly against infrastructure tags; the tags already are the interfaces
  ([ADR 0003](./adr/0003-pure-calendar-domain-effectful-payment-domain.md)).
- `D4` **hard**: Keep the engine pure (no clock beyond `startOfToday()`, no I/O) and its orchestration in
  `runPlanningPipeline`; callers pass inputs and read a result
  ([ADR 0006](./adr/0006-caller-owned-calculation-caches.md)).
- `D5` **hard**: Compute the Remaining Budget and Gain through `measureBudget` and `measureGain`, never by
  subtracting lengths at the call site.
- `D6` **hard**: Under `metrics/`, build the set of Closed Days through `closedDayKeys` and write a stretch metric as a
  predicate over `freeStreaks`; the selector and `measurePlan` count the same days as `dayIndex` integers, and no
  fourth spelling of a day joins `dayKey`, `getKey` and `dayIndex`.
- `D7` **hard**: Route Removed Days to `getAvailableWorkdays` only, and Manual Days to the planning calls as
  `manual-N` pseudo-Holidays and to `findPlanningCandidates` as `manualDays`, whose streaks (`alreadyOff`) the selector
  treats as already off and never counts as a Bridge's gain; a day the user will work never becomes a Free Day.
- `D8` **hard**: Carry in a domain event only what a handler or the use case that dispatches it reads; transport
  detail (user agent, IP address) stays with the metadata reader.
- `D9` **hard**: Hold an invariant that must survive concurrent writes in the SQL predicate
  (`status != 'succeeded'`, the contact slot's `WHERE NOT EXISTS`), not in a read followed by a write
  ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- `D10` **hard**: Write a Strategy as one `Objective` in `STRATEGY_OBJECTIVE` (a floor, a `rank`, an `aim`, and
  `admits` or `next` only when it needs them), applied by the one selector, `selectBridges`; a limit on what a stage
  may take goes in `admits` and a preference in `rank`, and a per-Strategy sort or a second walk is a defect
  ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D11` **hard**: Rank a candidate on what it adds to the plan built so far (the marginal gain, the stretch it ends
  up in, its distance from what is taken), never on a score it has alone; a candidate under its Strategy's floor stays
  out and the budget stays unspent ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D12` **hard**: Count what the engine optimises the way the Metrics count it: the free streaks around the placed
  days, the Manual Days' own (`alreadyOff`) included, through `measurePlan`; a selector that believes it gained more
  than the Metrics report has counted a Free Day twice
  ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D13` **hard**: Size a search by the engine's own constant and let the caller's count only slice what it returns
  (`ALTERNATIVES.SEARCHED` against `maxAlternatives`), so the Suggestion never depends on how many Alternatives the
  screen shows ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D14` **hard**: Keep selection incremental: after a pick, update only the candidates the new span touches, count
  in `dayIndex` integers and compute once what a run never changes; recomputing every fact per step, or building a
  `Date` or Temporal object per comparison, is the regression
  ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D15` **hard**: Treat what `strategies.test.ts` pins as what each Strategy means: an `Objective` change that keeps
  it is a tuning, and one that breaks it changes ADR 0020 and the glossary's Strategy entry in the same commit
  ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `D16` **hard**: Answer a ratio over an empty denominator with 0, never `NaN`, and pin it in a test
  (`generateMetrics`, `measures`, `budget`).
- `D17` **hard**: Sort with `toSorted`; `.sort()` is for an array the function has just built, because a sort in
  place reorders a caller's array.
- `D18` **hard**: Spell out the `Effect.Effect<A, E, R>` return type of every Effect program in `domain/payment`, for
  the same reason `A3` gives for use cases.
- `D19` **judgement**: Export a boundary predicate beside the default it is paired with, and test that it accepts
  that default (`isHolidayVariant`, the Planning Window's bounds).

## Application (`apps/web/src/application`)

- `A3` **hard**, *check pending*: Write a use-case export as `Effect.gen` with its `Effect.Effect<A, E, R>` return
  type spelled out, ending in `Effect.withSpan` named after the export; the annotation is what turns a stray
  `LoggerService` into a compile error ([ADR 0013](./adr/0013-loggerservice-stays-a-tag.md),
  [ADR 0017](./adr/0017-observability-is-the-platform-export.md)). Exports that differ only in the check each owes
  (`activateWithPayment`, `activateWithClaimedPayment`) may delegate to one private `Effect.gen` and share its
  return type as one named alias, because the annotation then bites where the requirements are yielded
  ([ADR 0008](./adr/0008-premium-derived-from-payment.md)).
- `A4` **hard**: Keep a use-case a value: it never runs itself, reads a request or picks an HTTP status.
- `A5` **hard**: Do date arithmetic in `dates.ts`: on Temporal underneath, or on a local date's own fields and the
  `dayIndex` integers where a round trip per call is the cost (`isSameDay`, `dayIndex`, `fromDayIndex`); every `Date`
  it returns is local midnight and compares with `isSameDay`, `compareAsc` or `isWithinInterval`, never through
  `toISOString()` ([ADR 0005](./adr/0005-temporal-polyfill.md)).
- `A6` **hard**: Bring a date in through `dateIntake.ts`, picked by its source: `fromUpstreamCalendarDay` for a day
  upstream named, `fromStoredInstant` for a value this app wrote.
- `A8` **hard**: Enforce a store bound in the setter every writer passes and again at rehydration, not at the control
  that happens to own it.
- `A9` **hard**: Handle a rehydration error first, through `onRehydrateFailure`, in every persisted store; `premium`
  alone falls through, on purpose.
- `A10` **hard**: Answer from a store action that can refuse with an outcome union carrying the reason (`DayOutcome`,
  `HolidayOutcome`); callers render the reason and never re-derive the rule.
- `A12` **judgement**: Read another store inside an action through `getState()`, knowing it is not reactive, and
  derive a value when it can be derived instead of reading a store another component fills.
- `A13` **hard**: Keep a DTO pure: `create` is a function of `raw` and `params`, SDK types arrive as `import type`,
  and `holiday/types.ts` stays evaluable in a Web Worker
  ([ADR 0003](./adr/0003-pure-calendar-domain-effectful-payment-domain.md)).
- `A14` **judgement**: Lay out a DTO concept with the fixed names (`types.ts`, `dto.ts`, `schema.ts`, `utils/`,
  `rules.ts`) and only the files it needs.
- `A15` **hard**: Take a number a message states from the exported constant that owns it (a schema's minimum, the
  engine's `MAX_CARRY_OVER_MONTHS`) through ICU (`{max, number}`), never from the copy.
- `A16` **hard**: Stamp what an async action writes with the inputs it was fetched for (`holidaysKey`) and drop the
  answer of a call a newer one overtook (`fetchHolidays`'s sequence number); a consumer acts only while the stamp
  matches what is on screen, and the stamp is never persisted.
- `A17` **hard**: Keep a rewrite of how persisted state is encoded byte-compatible with every blob already stored,
  and pin it with a test against the implementation it replaces (`utils/crypto.test.ts`)
  ([ADR 0007](./adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)).
- `A18` **judgement**: Add a persisted field without a `STORAGE_VERSION` bump when the initial state supplies it and
  rehydration narrows it; bump and migrate only when an old blob would rehydrate into a wrong value.

## Infrastructure (`apps/web/src/infrastructure`)

- `I1` **hard**: Construct a server SDK only in `infrastructure/clients`, as a `Context.Tag` plus a `Layer.sync` Live
  layer that builds the client lazily in its closure; a browser SDK (Stripe.js, the tracking and tutorial drivers) is
  a memoised module instead ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `I2` **hard**: Read configuration inside the call, never while a layer is built, so a missing variable fails only
  the routes that reach that client.
- `I3` **hard**: Implement a flow that a route and a server action share once, under `api/operations/` (rate limit,
  use-case, deferred write, status mapping); the transports only adapt the outcome.
- `I4` **hard**: Run the rate limit before the request body is read.
- `I5` **hard**: Derive status and code from `describeFailure`: a new tagged error joins `TaggedFailure`, and
  `catchTags` stays for a branch local to one route.
- `I7` **hard**: Use `getCloudflareContext({ async: true })` in code that may run outside a request; the sync form
  only inside one.
- `I8` **hard**: Turn a candidate into a locale only through `resolveLocale` (a check that a value already is one,
  `isLocale`, and the `Accept-Language` parser excepted), and order a localised option list only through
  `collateByLabel`.
- `I10` **hard**: Exit every country-detection strategy through `normalizeCountryCode`, so a sentinel (`XX`, `T1`) or
  a malformed code never reaches the week-long `user-country` cookie.
- `I11` **hard**: Write and read donation metadata only through `provider/metadata.ts`, and payment values through
  `normalForms.ts`.
- `I12` **hard**: Round money to cents where it is computed.
- `I13` **judgement**: Compose a new Holiday rule in `observedHolidays`, above the `HolidaySource` seam, so the
  fixture adapter runs it too.
- `I14` **hard**: Guard the lookup, not the work, in a wrapper with a fallback (`traced` in `span.ts`), so the work
  runs exactly once.
- `I15` **judgement**: Scope a batching transport to the request that armed it; workerd refuses I/O on behalf of
  another request.
- `I16` **hard**: Spell out the `Effect.Effect<A, E, R>` return type of every Effect program `infrastructure/services`
  exports, for the same reason `A3` gives for use cases.

## Routes (`apps/web/src/app`)

- `R1` **judgement**: Keep route files thin: pages compose `@ui/*`, handlers parse, run a use-case or an operation
  and map the result.
- `R2` **hard**: Close a handler's error channel (a `catchAll`, or an exhaustive `catchTag` of its one tag) and
  provide `ApplicationLayer`, so the route never rejects; run its main program inside `traced({ name, run })`, named
  after the use case (`span.ts`).
- `R4` **hard**: Answer failures with `ApiError` codes; only a `ValidationError` message reaches the body as text,
  and a `PromoCodeError` reaches it as its machine `code` (`promoCodeErrors.*`).
- `R5` **hard**: Send `no-store` through `noStore` when the body depends on cookies or per-request state or sets a
  cookie, and state a cache policy on every branch of a cacheable route, the miss included.
- `R6` **hard**: Call `setRequestLocale(locale)` first in a page or layout under `[locale]` that reads translations
  from the request locale, or pass the locale explicitly; skipping both opts the segment out of static rendering.
- `R8` **hard**: Build internal URLs with `localePath` and `localeAlternates`; English carries no prefix.
- `R9` **hard**: Look up request-keyed documents in a `Map` behind a function (`lookupWellKnownDocument`) and export
  nothing indexable, because `Object.prototype` keys pass a truthiness guard.
- `R11` **judgement**: Return plain objects from a `.well-known` document module and let the route own the envelope;
  a new document is a new key, not a branch.

## UI (`apps/web/src/ui`)

- `U1` **hard**: Take from `@domain/calendar` only pure values and arithmetic (types, constants,
  `resolveSelectedDays`, `measureBudget`, `measureGain`, the Planning Window helpers); Suggestions arrive from the
  worker through the holidays store, never from a generator or a selector.
- `U2` **hard**: Import from `@infrastructure/*` only the listed seams: the locales and `localePath`, the tracking
  helper, `errors`, the worker types and serializers, `getPublicEnv`, `getCountries`, the Country cookie's name
  (`proxy/cookie`), the Stripe browser client, the driver.js client and the `payment` and `contact` server actions.
- `U4` **hard**: Keep server components free of hooks and store access.
- `U5` **hard**, *check pending*: Render on the server by default and add `'use client'` to any file with state, an
  effect, a store read, an event handler or a recharts chart, even when every current importer is already a client
  module.
- `U6` **hard**: Opt a component out of the server render with `use(browser())` under a `<Suspense>`; module scope,
  plain utilities and event handlers keep a `typeof window` or `typeof document` guard, or read `globalThis.window`,
  which is `undefined` on the server.
- `U8` **judgement**: Place a new component in the first folder that fits: vocabulary-free and stateless to `core/`,
  one screen to `pages/<screen>/`, several screens to `shared/`, Premium or money to `premium/`, a render-null side
  effect to `providers/`, `stores/`, `tracking/` or `tutorial/`; a helper `shared/` needs moves up to
  `shared/utils/`.
- `U11` **hard**: Build `asChild` on `Slot.tsx` (or `MotionSlot`), merge a `className` a component receives with its
  own through `cn()`, and mark composition sub-parts with `data-slot`. A static class list stays a plain string,
  because `cn()` drops a class twMerge takes for a conflict (`leading-tight` before `text-[10px]`); a conditional
  override of the component's own classes may go through `cn()` so the override wins, and a component that replaces a
  received `className` instead of merging it (`RichLink`) says so in its guide.
- `U12` **judgement**: Reach for CVA only for orthogonal variant axes; a single short `variant` is a `cn()` call or a
  local record.
- `U13` **hard**: Wrap a multi-field store selector in `useShallow`, imported from `zustand/react/shallow`, or every
  store write re-renders the consumer.
- `U14` **hard**: Declare at module scope a motion configuration object that feeds a dependency list, a context or
  `m.create`, and any `MotionSlot` child, so its identity is stable across renders; motion compares an inline
  `initial`, `animate` or `transition` by value, so those may stay inline.
- `U15` **hard**: Keep what the render reads in state, not a ref; draw a number the visitor types with `NumberInput`,
  never `type="number"`, and hold it as `number | null`, where `null` is an emptied field or text it cannot read and
  the owner converts it where it is used (the accrual and salary calculators, the Donation amount), because
  `NumberInput` keeps the typed text and reads it in the visitor's language, and state that converted every keystroke
  would write `0` over what is being typed ([ADR 0021](./adr/0021-numbers-a-visitor-types-are-localised-text-fields.md)).
- `U16` **hard**: Keep a timer's or an animation frame's handle where its cleanup reaches it (the effect that set it,
  or a ref when several callbacks share it) and clear it on close and on unmount.
- `U17` **hard**: Key selections and list items by the item (the Holiday's id and name, a key built from the date),
  never by render position.
- `U19` **hard**: Set anything that depends on "now" in an effect after mount (`today` starts `null`, and a year
  starts as the one the server rendered with, which `useCurrentYear` swaps for the visitor's), and gate store-backed
  numbers on `useStoresReady()`, so server and client agree on the first pass.
- `U20` **judgement**: Let a generic component take predicates for the states its caller owns (`dayStates`) instead
  of the caller's store types.
- `U21` **hard**: Read Premium from the store at the gate (`PremiumFeature`, `usePlannerDayClick`), never through
  props, and let the gate answer for itself.
- `U22` **hard**: Name the baseline of every figure: Gain and the budget badges divide by the PTO Day budget,
  Efficiency by the days placed (read from `usePlacedPlan`); aligning them by moving a denominator is a regression.
- `U23` **hard**: Size charts from the array the engine returns; a Quarter belongs to the Planning Window and the
  bucket count grows with the Carry-over Months.
- `U24` **hard**: Stop input during a calculation in the handler (`PLAN_IN_FLIGHT`); `pointer-events` blocks the
  mouse and nothing else.
- `U25` **judgement**: Keep an Effect program out of a component: a fallible browser call lives in a module of its
  own (`ui/adapters/payments/checkout.ts`, `ui/modules/export/exportPdf.tsx`) that the component imports where it
  needs it, and joins ADR 0002's list of browser files that use Effect
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `U26` **judgement**: Keep randomness out of a prerendered or cached body, where it runs once per build rather than
  per visitor.
- `U27` **hard**: Keep a heavy dependency out of the first load: the `date-holidays` dataset, the Effect runtime and
  the PDF renderer out of the planner's, and zod out of every page's, each arriving through `import()` in the
  function that needs it and pinned by a test that reads the importer's source (`CalendarExport.test.tsx`,
  `location.test.ts`, `checkSession.test.ts`); a `dynamic()` section rendered on the server is still in the first
  load.
- `U28` **hard**: Mount a `dynamic()` modal with no trigger of its own only once it has opened (`useHasOpened`) and
  keep it mounted after, so its close animates; a mounted modal is downloaded while it stays shut.
- `U29` **judgement**: Subscribe a component to the store fields it renders and no more: the Summary and the
  calendar export read `usePlacedPlan`, which leaves out `isCalculating`, so a calculation does not redraw every chart
  twice.
- `U30` **hard**: Read a context a component cannot work without through a `use…` hook that throws outside its
  provider, so a missing provider fails at the first render instead of rendering defaults.

## Accessibility

- `X1` **hard**: Take a `core/` component's accessible name as a prop, and require it in the prop type when the
  component renders a nameless control (`Label`'s `htmlFor`, the `Switch` and `Checkbox` name union, `Slider`'s
  `label`, `TooltipInfoTrigger`'s `aria-label`).
- `X2` **hard**: Declare an ARIA role only together with its whole pattern (ownership, keyboard model); otherwise use
  the semantic element (the consent banner is a labelled `section`, and its preferences are the dialog).
- `X3` **hard**: Pair `outline-none` with a visible focus treatment (a `focus-visible:ring-*`, the shadow an input uses,
  the background a menu item takes); only a programmatically focused popup (`PopoverContent`, `DrawerContent`) goes
  without one.
- `X4` **hard**: Add `aria-pressed` to a button whose `variant` flips with its state.
- `X5` **hard**: Point every label at a labelable element (`FormControl` wraps the input inside `InputGroup`); where
  no such element exists, render a heading (`FormHeading`) and let the control name itself.
- `X6` **hard**: Reference only ids present in the DOM from `aria-describedby` and `aria-labelledby`, and generate
  ids in a component mounted more than once.
- `X7` **hard**: Make a sortable column header a button inside the `th`, which carries `aria-sort`.
- `X8` **judgement**: Announce a number through one live region, even when it is on screen twice.

## Styles (`apps/web/src/ui/styles` and component CSS)

- `S1` **hard**: Draw colours, frames and shadows with the tokens in `global/index.css` (`--frame`,
  `--shadow-brutal-*`, `--color-brand-*`, and a role token such as `--positive` or `--wash-teal` for the rest); a
  literal is wrong in one of the two themes, so a colour with no token gets one named for its role, declared in both
  themes and mapped in `theme/index.css`, and a consumer that cannot read a custom property (the Stripe iframe, the
  PDF, the skeletons, the confetti) takes a named constant from `ui/styles/palette.ts`, and the email templates one
  from `application/email/palette.ts`, never a literal of its own; `palette.test.ts` holds each constant that repeats
  a token equal to it.
- `S2` **hard**, *check pending*: Pair every `hover:-translate-*` with `hit-area-stable`, and a hover rotation with
  `hit-area-stable-tilt`, on the element that receives the pointer, so the hit area holds still under it; a child that
  moves on its parent's `group-hover` needs neither.
- `S3` **hard**: Style nav and footer links with the `quiet-link` utility.
- `S4` **hard**: Co-locate a stylesheet with the component that imports it; `src/ui/styles/` holds only cross-cutting
  CSS and `palette.ts`, the tokens' JS twin.
- `S5` **hard**: Place overlays on the z-index scale: modal surfaces up to `200`, popover and dropdown positioners at
  `210`, tooltips at `220`, a new transient overlay above `210`. The cookie banner is the exception at `100`, above
  every page layer (the planner drawer, the mobile sidebar), because until it is answered it must stay within reach,
  and below the dialog its own preferences open in.
- `S6` **judgement**: Restore a body-level lock in the same effect's cleanup, never in an animation callback.
- `S7` **hard**: Read a custom property only where something declares it: a token in `global/index.css`, a stylesheet,
  code that sets it (a style key, an arbitrary property, `setProperty`, a font's `variable`) or a library that does (a
  Base UI `CssVars` module, Tailwind's default theme). A name only an `@theme inline` block declares does not count,
  because Tailwind inlines it and never emits the property, and a CSS module counts none that Tailwind emits on demand
  (its default theme and a plain `@theme` block): it never compiles the module, so the variable exists only while some
  utility uses it. A module reads a token, or a name an `@theme static` block declares (`--spacing` and the `--text-*`
  and `--shadow-lg` scale steps `legend.module.css` takes). An undeclared `var()` resolves to nothing and the property
  falls back to the inherited value in silence, so a typo or a deleted token ships unnoticed.
- `S8` **hard**: Keep what the app does not ship out of its stylesheet: `index.css` ends with the `@source not` lines for
  the test files, the `e2e` folder and the Markdown, because Tailwind scans every file under `apps/web` that git does
  not ignore, and a class that only a fixture or an example spells becomes a rule in the shipped CSS.

## Message bundles (`apps/web/src/ui/i18n`)

- `L1` **hard**: Write a sentence as one key, with an ICU plural where it carries a count; a component never
  assembles copy from fragments.
- `L2` **hard**: Express uppercase with the `uppercase` class and emphasis with a rich-text tag; copy stays in
  sentence case. A code shown as itself (`locale.toUpperCase()`) is not copy, and the style of a whole sentence stays
  in the component.
- `L3` **hard**: Pass amounts, large numbers, decimals and percentages in already formatted (`amountFormatter`,
  `useCurrencyFormatter`, `format.number`), never abbreviated or rounded by hand (`toFixed`, a `%` or `x` glued on),
  because five of the six locales write the decimal with a comma. A message takes the formatted value as `{n}` or a
  count as `{n, number}`, never with a style (`{pct, number, percent}`): production precompiles the bundles, and the
  precompiled runtime knows no named format, so the argument would print a bare `1`.
- `L4` **hard**: Keep in the `a11y` namespace every screen-reader announcement and the accessible names several
  features share; a name one feature alone uses stays in that feature's namespace, whichever component renders it.
- `L6` **hard**: Add the key for a user-visible code in the same change as the code; a feature's `errors` carries
  only the codes whose copy differs from the shared `errors` base.
- `L7` **judgement**: Keep copy that several forms need in one namespace (`validation.email`).
- `L8` **hard**: Give every Zod rule a user can trip a message key; Zod's own fallback is English prose.
- `L9` **hard**: Write a list as numbered or named sibling keys, never as one value a component splits, because the
  bundle check counts keys and not the items inside a value. The homepage marquee is the exception:
  `homepage.marquee.items` is one string split on ` · `, since the strip is decorative (`aria-hidden`), loops, and no
  item's place in it means anything.
- `L10` **hard**: Address the user informally in every locale (du, tu, tú); the Spanish, Catalan and Italian bundles
  have no scan behind them.
- `L11` **judgement**: Name the component that draws an icon when copy describes it, and check every bundle when the
  icon changes.
- `L12` **judgement**: Add a namespace that only server components read to `SERVER_ONLY_NAMESPACES`; every namespace
  the list does not name ships in every page's HTML, and `clientMessages.test.ts` catches the opposite mistake.

## Analytics and privacy

- `P1` **hard**: Call `track()` in the handler where the interaction lands, or in a store action the interaction
  calls, never where a rehydration or an effect would run it again. A result that lands later is asked for in the
  handler and reported where it lands, only when asked: `planner_generated` counts the plans a person asks for
  (`askForPlan` in the handler, `claimPlanAskedFor` where the worker's answer lands), never a load or a restore, and
  a Donation the issuer took over lands on the payment confirmation page, whose mount calls `confirmActivation` once
  to report `premium_activated` on the move into Premium, and only while the one-shot proof the activation route sets
  (`ACTIVATION_COOKIE`) is unspent; the store spends it in the same task as the report, so a reload during the call
  reports once and a reload after it, a revisit, a history entry the payer left early and returned to, a restored
  session or a visitor whose `localStorage` was cleared reports nothing. The one `track()` inside an effect counts a
  view rather than an interaction: the contact form a `#contact` link opens.
- `P2` **hard**: Send ids and machine codes in events (a `PremiumFeatureId`, an `ApiError` code), never translated
  strings, dates, Manual Days, Custom Holiday names or a salary.
- `P3` **hard**: Read consent per service through `consent.ts` (`acceptedService`), and give a new service its own
  gate.
- `P4` **judgement**: Give a trigger several surfaces share a `source` that the store's opening action reports
  (`QuickStartSource`, `DonateSource`), so an event says where the interaction began.

## Security

- `Z1` **hard**: Build a redirect by assigning `pathname` on a parsed URL; a request-derived path resolved as a
  relative reference can change the origin.
- `Z2` **hard**: Compare secrets in constant time, length first.
- `Z3` **hard**: Encode every runtime value interpolated into a URL with `encodeURIComponent`; a constant of the
  app's own (a locale, a route) needs none.
- `Z4` **hard**: Keep `/api/health` to `status` and `timestamp`; it is public and advertised.
- `Z5` **hard**: Read the Markdown twin's path only from the `x-markdown-path` header, matched exactly; a query
  fallback lets anyone relabel a URL.
- `Z6` **hard**: Keep confidential values out of persisted store state; they belong in the signed cookie or on the
  server ([ADR 0007](./adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)).
- `Z7` **hard**: Resolve a client address with `resolveClientIp`, whose header order is a security decision.

## Tests

- `T1` **hard**: Prove a new assertion, in a unit test or in the contract suite, by breaking the code it guards and
  watching it fail, permuting a pair rather than only renaming a token, because an assertion that never failed
  advertises coverage it lacks.
- `T2` **hard**: Shape a double like the real dependency (a response the real account returned, the SDK's own
  fields, the real return type), typed against its real signature (`vi.fn<typeof X>`, `vi.mocked` with the real error
  class) whenever the tested code consumes its return; a stand-in component that renders `null` is exempt, and so is a
  `next-intl/server` double handed `createTranslator`, whose overloads `vi.fn<typeof …>` cannot express. A double
  built from the code's reading of the API agrees with the bug.
- `T3` **hard**: Assert through the real helper (`noStore`, the real DTO over a fixture source), not a mock that
  re-implements it; a unit test mocks no DTO module, whatever it returns.
- `T4` **hard**: Give an assertion of absence, or a loop over results, a positive control: assert the list is
  non-empty, or that the suite can make the selector appear, because an assertion over an empty set passes whatever
  the code does.
- `T5` **hard**: Choose inputs under which the defect is observable (a window with Carry-over Months, an emission
  order unlike the sorted one, a zone with daylight saving such as `Europe/Madrid` across both changes).
- `T6` **hard**: Co-locate unit tests as `*.test.ts(x)` beside the module; `e2e/` proves what the Worker answers
  (routes, HTTP contracts, one flow per entry point), so a component with behaviour carries its own test.
- `T7` **hard**: Substitute service tags with `Layer.succeed`, and mock every Live layer with `Layer.empty` in a test
  that imports `layers.ts`; no test builds a real Stripe, Turso or Resend client
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
- `T8` **hard**: Compare codes against `ApiError.*`; the tag-to-status table is asserted row by row in
  `errors.test.ts`, and an operation's test asserts the states it produces by tag.
- `T9` **hard**: Clear both calculation caches in the `beforeEach` of every `describe` whose subject reaches `getKey`
  or `createHolidaySet`, unless the subject is the pipeline, which clears them itself on entry
  ([ADR 0006](./adr/0006-caller-owned-calculation-caches.md)).
- `T10` **judgement**: Build calendar fixtures in January 2025 unless the case is about year boundaries or Quarters,
  or measures a Strategy over a real year (`strategies.test.ts`).
- `T11` **judgement**: Render components inside `NextIntlClientProvider` with the real bundles, often several
  locales, test a server component by replacing `next-intl/server` with `createTranslator` and `createFormatter` over
  the real bundles, and replace stores with `vi.mock` plus a plain state object. A stub translator (`(key) => key`)
  has no `rich` and hides a missing key.
- `T12` **judgement**: Assert a component's seams: the key resolves, the accessible name reaches the element with
  the behaviour, an `href` points where the copy says.
- `T13` **hard**: Assert a mocked third-party package on the call pattern, never on the data it returns.
- `T14` **judgement**: Test a table on a property the table alone can break plus a second source, never a row
  against itself.
- `T15` **hard**: Give a constant-time comparison a test pair of equal length, so the test exercises the comparison
  rather than the length guard in front of it.
- `T16` **judgement**: Treat a test that installs what production must provide (a context manager, a global) as
  proving nothing about production.
- `T17` **hard**: Read a motion value only after awaiting a frame.
- `T18` **hard**: Import the app's constants into e2e specs (header names, error codes, cookie names) and assert
  cache headers directionally; a public contract (a route, a `.well-known` slug, the smoke set) stays a literal, typed
  against the app's declaration where one exists (`satisfies RoutePath`), because that literal is the oracle that
  catches a change breaking what is already out there. An e2e spec takes its locales from `LOCALES` and
  `localePath`, never a list of its own.
- `T19` **hard**: Tag a case `@smoke` only for what proves the Worker answers on every deploy, never a result that
  depends on the caller's address, and keep the three cases every repository that deploys runs (a titled homepage, an
  unknown path answering 404, `robots.txt` served) word for word, because a failing smoke run rolls production back.
  The docs site runs the same three against its own deploy.
- `T20` **hard**: Guard every list a contract-suite assertion derives from the repository (files, rows, matches) with
  a non-empty assertion or a synthetic self-test, because an assertion over an empty census passes whatever the tree
  holds.
- `T21` **hard**: Test an SDK client's missing-variable path twice: the layer still builds, and the first call fails
  with the service's tagged error, which is what proves `I2`.
- `T22` **judgement**: Test an optimiser on what it is for over a real calendar (each Strategy's aim, the selector's
  count equal to the Metrics, no Alternative ahead of the Suggestion), never on the dates it picks
  ([ADR 0020](./adr/0020-strategies-are-objectives-over-the-marginal-gain.md)).
- `T24` **judgement**: Pin a prohibition only the runtime would see (a server-only import, a module the client must
  not bundle) by reading the source in a test.
- `T25` **judgement**: Test a server page, layout or boundary by calling it and reading the tree it returns, with its
  children replaced by `vi.fn().mockReturnValue(null)`.
- `T26` **hard**: Resolve every `dynamic()` loader to its named export in a test (capture the loader and compare
  what it resolves to with a `vi.mock` sentinel), because a renamed export otherwise fails only in the browser.
- `T27` **hard**: Assert in the test of every component that calls `track()` that no personal value reaches the
  recorded calls, either by the exact list (`toStrictEqual`, `toHaveBeenCalledExactlyOnceWith`) or by a leak guard over
  `JSON.stringify(track.mock.calls)`, which is how `P2` stays true.
- `T28` **judgement**: Test a loading fixture (`*Fixture.tsx`) for its shape alone: no text and no `button`, `a` or
  `input`, because a skeleton a person can focus is a control that does nothing.
- `T29` **hard**: Give every message with rich-text tags a test that renders it in all six bundles (`it.each` over the
  bundles) and fails on a raw tag, a brace or a raw key, because ICU breaks per locale.
- `T30` **judgement**: Let a child double expose the props it receives as `data-*` attributes, so a test asserts
  what the parent passed without rendering the child.
- `T31` **judgement**: Mock `motion/react` with `m.*` elements that drop the motion props, and expose what a case
  asserts as `data-*` attributes (`data-animate`, `data-transition`), so the test needs no frame at all.
- `T32` **judgement**: Keep each contract-suite rule one aggregated failing list (`toEqual([])` over the offenders),
  so one run shows every breach.
- `T33` **hard**: Pin the clock a case depends on (an injected `today` or `now`, or
  `vi.useFakeTimers({ now, toFake: ["Date"] })` undone in an `afterEach`, an `afterAll` for a change made once for the
  whole file, or a `finally` around the change) and assert the exact instant or year it yields, because a bracket
  between two readings of the real clock passes whatever the code computed in between and a year read off it moves
  the expected value every January.
- `T34` **hard**: Undo in an `afterEach` (an `afterAll` for a change made once for the whole file), or a `finally`
  around the change, whatever a test changes outside itself (a spy, a stubbed global or environment variable, fake
  timers, an element appended to `document.body`, a module-level double's state), because a line at the end of a
  test body never runs once an assertion above it fails and the change leaks into every later test in the file. A
  store or a module-level double needs no undo of its own where a `beforeEach` sets it back for every case (`T35`,
  `ManagementBar.test.tsx`) or every case that reads it arranges it first (`AllowPastDays.test.tsx`).
- `T35` **judgement**: Reset a store in a `beforeEach` from its own initial state (`setState(getInitialState())`, or
  the store's reset action), never from a literal copy of it, because a copy drifts from the store and a field the
  store gains then carries from one test into the next.

## Workflows and scripts

- `C3` **hard**: Make a release job need the deploy and the smoke run it releases, so a tag means the version is live
  and answering.
- `C4` **hard**: Add a job that must gate a merge to its workflow's `check` aggregate.
- `C5` **hard**: Gate a path-filtered deploy on every path its bundle is built from.
- `C6` **hard**: Pass `wrangler deploy --message` a single token with no spaces or parentheses; OpenNext re-spawns
  wrangler through a shell.
- `C7` **hard**: Ship Worker secrets with `wrangler deploy --secrets-file`, written under `$RUNNER_TEMP` and removed
  in an `if: always()` step.
- `C10` **hard**: Every `uses:` names a full commit SHA with its version in a trailing comment, or its branch for a pin
  that follows one, and the two move together: the SHA is what runs, the comment is the only thing that makes it
  legible, and Renovate maintains both halves. This repository's own actions and workflows (`$/.github/…`) have no
  SHA to name.
- `C11` **hard**: YAML carries no explanatory comments; the reason for a line goes in the commit message, the pull
  request, an ADR or a rule here, and a gotcha an implementer would otherwise trip on goes in the *Gotchas* of
  [AGENTS.md](./AGENTS.md). The trailing comment on a SHA pin is the one exception. A tool directive
  (`# zizmor: ignore[...]`, `# yaml-language-server: ...`) counts as a directive, not a comment, and what a bot writes
  is its output, not ours: the lockfile, and the `# Renovate security update: …` line Renovate adds to
  `pnpm-workspace.yaml`, whichever versions it names.

## Docs site (`apps/docs`)

- `W1` **hard**: Import into demos only modules free of `next/*`, `next-themes` and app context, and list every app
  path the site reaches in `DOCS_PATHS`.
- `W2` **hard**: Name a file in prose, never a volatile literal: import and interpolate the app's constants, and type
  variant and prop tables as `Record`s so a rename fails `astro check`. The consent service ids are the one set the
  site repeats on purpose, and the contract suite holds them equal to the app's.
- `W3` **hard**: Add a provider an app component needs to `Demo.tsx`, not to a single demo.
- `W5` **hard**: Draw diagrams as Mermaid fences, rendered at build time.
- `W6` **judgement**: Prefer a fenced block; write a raw `<pre>` only for content interpolated from app constants.
- `W9` **hard**: Keep `hideFromBots` on in the consent config; the consent spec overrides `navigator.webdriver`
  instead.
- `W11` **judgement**: Mount every demo as `<XDemo client:visible />`, so a page hydrates only the demos a reader
  scrolls to.
- `W12` **judgement**: Name a module-level literal constant in SCREAMING_SNAKE_CASE and a function in camelCase.

## Guides and decision records

- `G1` **judgement**: Cite symbols, not line numbers; a line citation rots when anything above it moves.
- `G2` **hard**: Cite package-relative paths inside a package guide, because the guide sits inside the package it
  describes.
- `G3` **judgement**: Propose an ADR only for a decision that is hard to reverse, surprising without context and the
  result of a real trade-off, and link it from where it bites.
- `G4` **hard**: Write a guide in the present tense, holding what an implementer needs while working; the reason for
  a line goes in the commit message, the pull request, an ADR or a rule here, and history ("used to", "was",
  "until …") stays in git, because a guide is loaded into every session that works in its folder.
- `G8` **judgement**: Write a published wiki page in the present tense and leave its history to git: a reader needs what
  the system does and why, so a correction rewrites the sentence instead of narrating the one it replaces ("used to",
  "no longer", "until …", a dated incident), because the wiki is published and nobody opens its history to learn what is
  true now. The contract suite fails the plainest of those phrases outside code and quotes; a participle ("used to
  pre-select") and a state ("no longer exists") are not history, and the rest is a call.
- `G5` **hard**: Keep `GLOSSARY.md` to vocabulary: the term, one or two sentences on what it is, and the words it
  displaces, never how it is built, because mechanism belongs to the folder guide or an ADR.
- `G6` **hard**: State a rule once: a rule about how code is written here, a coupling or a gotcha in the guide of the
  folder it bites, a decision in an ADR; a wiki page says where the rule lives, because the wiki is published and
  nothing checks a copy.
- `G9` **hard**: Fix a breach in the change that finds it, or report it on the pull request with the rule it breaks;
  no guide keeps a list of known inconsistencies, because an entry is a claim about the code that nothing keeps true.

## Deliberate overrides of the smell baseline

- **Primitive Obsession**: PTO Day counts, Efficiency, Gain, Year, the Preferred Months and Holiday ids stay numbers
  and strings; a sealed union that crosses a boundary gets a membership predicate, not a value object
  ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- **Duplicated Code**: `logging/logger.ts` is byte for byte what the sibling repositories carry and
  `logging/contract.ts` differs from theirs only in `LOG_SERVICE`, so a change to either is made in all three
  ([ADR 0018](./adr/0018-the-platform-is-the-log-transport.md)).
- **Duplicated Code**: the stated-version helpers (`VERSIONED_DEPENDENCIES` through `declaredIn`) and the
  release-config helpers (`BREAKING_PARSER_OPTS` through `parserOptsOf`) in `tests/docs-consistency.test.ts` are byte
  for byte the same in biancafiore, contribKit and github-star-tracker, so a change to one is made in all three.
- **Duplicated Code**: the three smoke cases are word for word the same in every repository that deploys, and in
  both packages here, so a difference between them is drift, not a variant.
- **Duplicated Code**: `contactSenderKey` and `normalizeEmail` stay two normalisers: one keys the contact guard, the
  other decides who recovers Premium.
- **Duplicated Code**: `getPublicEnv` (build-safe) and `getRequestPublicEnv` (per request) stay two readers, one per
  timing.
- **Duplicated Code**: the `'succeeded'` literal repeats inside the payments SQL, and the contract suite ties each
  copy to `PAYMENT_SUCCEEDED` ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- **Duplicated Code**: the deferred writes keep their own bodies; a `deferWrite` combinator would take as many
  parameters as the bodies have lines.
- **Duplicated Code**: `amountFormatter` (a whole-euro choice) and `useCurrencyFormatter` (an amount about to be
  charged) stay two formatting paths.
- **Duplicated Code**: the Stripe Elements appearance (`stripeAppearance.ts`) draws with the palette that
  `ui/styles/palette.ts` repeats from the theme tokens and repeats the shadow scale by value, and
  `public/fonts/stripe/` copies the two faces it types in, since the iframe reads neither CSS variables nor
  `next/font`'s hashed files; the driver.js buttons repeat the `hit-area-stable` insets and `Button`'s variants in
  `ui/modules/tutorial/driver.css`.
- **Duplicated Code**: consent is answered through the config callbacks in `CookieConsent.tsx` and heard through
  window events in `BetterStackTracking.tsx`.
- **Duplicated Code**: `dayKey` (the metrics), `getKey` (the cache) and `dayIndex` (the selector and `measurePlan`)
  stay three spellings of one day: the metrics must not depend on the cache's clear, and spans need integer
  arithmetic.
- **Middle Man**: `LoggerService` returns the same `logger` object the import does; it exists so a return-type
  annotation catches a stray requirement ([ADR 0013](./adr/0013-loggerservice-stays-a-tag.md)).
- **Middle Man**: `activateWithPayment` and `activateWithClaimedPayment` delegate to one private implementation, each
  owning its required parameter.
- **Middle Man**: the `*Client.tsx` shells that only `dynamic()`-import with `ssr: false`, `LazyContactModal.tsx`,
  which mounts a `dynamic()` modal once it has opened, and `DriverStyles.tsx`, which renders `null`, exist to keep code
  out of a bundle.
- **Speculative Generality**: every use-case export ends in `Effect.withSpan`, which nothing consumes today; it marks
  the boundary a tracer would attach to ([ADR 0017](./adr/0017-observability-is-the-platform-export.md)).
- **Speculative Generality**: `refreshPremiumStatus` keeps its transition guard with no caller, and the
  promotion-code expiry branches stay as guards although the API filters most of what they test.
- **Repeated Switches**: `processWebhookEvent` switches on the Stripe event type; there is no dispatcher and no event
  bus ([ADR 0014](./adr/0014-ddd-where-it-pays.md)).
- **Mysterious Name**: `repository.ts` keeps its name for a table gateway
  ([ADR 0014](./adr/0014-ddd-where-it-pays.md)), and the `crypto.ts` files keep theirs for obfuscation because the
  guides cite those paths; the exports inside say what they do.
- **Refused Bequest**: `SessionConfigurationError`, `WebhookConfigurationError` and `PaymentRequestError` add no
  members and keep the parent's `_tag`; they are markers narrowed with `instanceof`
  ([ADR 0002](./adr/0002-effect-for-external-service-boundaries.md)).
