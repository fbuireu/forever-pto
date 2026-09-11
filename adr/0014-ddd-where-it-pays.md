# 14. DDD where it pays: the strategic half is not negotiable, the tactical half earns its place

Date: 2026-08-30

## Status

Accepted. States the rule that [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md) and
[ADR 0012](./0012-shared-date-helpers-stay-in-the-application-layer.md) were each applying case by case
without naming it.

Amended on 2026-09-11. Worked example 2 answered *Reachable: no* on the grounds that Stripe owns the payment
status, and that was wrong: Stripe's enums are **open**, so it adds values on an API version already pinned.
The rerun and what it bought are recorded in that example.

## Context

This tree speaks domain-driven design fluently and never says so. `CONTEXT.md` opens by calling itself "the
ubiquitous language" and is the only document in the repository that uses the phrase. *Bounded context* is
load-bearing across the ADRs and the layer guides. *Domain event* is the vocabulary of the payment context's own
guide, of other guides and of the wiki. There is a `domain/` layer holding its bounded contexts, an `application/use-cases/` folder, and an `application/dto/` folder whose own guide describes it as
"the translation seam between external shapes and the vocabulary in `CONTEXT.md`", which is an
anti-corruption layer under a different name. The string `DDD` appears in no file in the repository.

So the approach is everywhere in the vocabulary and nowhere in the decisions, and the suffix people reach for
when describing it, *DDD(ish)*, is undefined. That gap is not cosmetic; it costs in both directions, and this
tree has paid both bills.

**Reading the "ish" as "not finished yet" produces work nobody wants.** ADR 0003 exists partly to refuse one
such proposal, extracting repository interfaces into the payment domain, and had to spell out that the Effect
service tags already *are* the interfaces and are already substituted in tests. Without a standing rule, that
argument is re-run from scratch by whoever arrives next, and the answer depends on how tired the reviewer is.

**Reading it as "the rules are aspirational" produces documents that describe a different program.** The
published architecture overview drew `app -> ui -> application -> domain` with a couple of side arrows. Walking every
import specifier under `apps/web/src` gives far more production edges than the figure drew, and the
largest one it left out was `app -> infrastructure`, the widest edge in the tree. The infrastructure layer
guide said *must not import from `@ui/*`* and asserted that nothing did, which was true of the literal
specifier and false of the layer: imports reach `src/ui/i18n/messages/` through the `@i18n` shorthand.
The same guide said the domain reach was *in `workers/` only, from `@domain/calendar/*`*, while
`services/payments/repository.ts` takes `PaymentStatus` out of `@domain/payment/`. Claims, none of them
written dishonestly, all of them read off the intent rather than off the tree.

What is missing is not more DDD. It is a written line between the half of it that is a constraint here and
the half that is a technique to be used when it pays, plus a test that decides which side a given case falls
on. Writing that line down is what stops both failure modes: the first because the omissions become
deliberate and named, the second because the claims become measurements.

## Decision

**The strategic half is not negotiable.** These are it, and a change to any of them is a change to this ADR:

1. **Ubiquitous language.** [`../CONTEXT.md`](../CONTEXT.md) is the authority over names in code, in
   user-facing copy and in these documents. One canonical term per concept, with the competing names listed
   under `_Avoid_`. A variable named for a retired term is a defect, not a style preference; the glossary is
   the only thing keeping the rival names for the same number apart.
2. **Bounded contexts.** `domain/calendar/` and `domain/payment/` share no code and no types, and there is no
   reason for one to import the other. Premium is the only thing that connects them and that connection
   lives in the application layer.
3. **Layer boundaries.** The layers under `apps/web/src/`, plus `middleware.ts`. Each has a `CLAUDE.md` stating
   what it may reach.
4. **Dependency direction, as measured rather than as intended.** The graph is published as a counted table
   on the architecture overview and
   [`tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) fails when it and the tree disagree
   in either direction. An arrow that only exists in prose is not a boundary.
5. **The anti-corruption layer.** `application/dto/` is where a `date-holidays` `RawHoliday`, a Stripe
   `PaymentIntent` and an `i18n-iso-countries` map become `HolidayDTO`, `PaymentData` and `CountryDTO`. No
   SDK is constructed inside it, and a `Raw*` type may be named only there and in the adapter that produces
   it: never in a store, a component, a page, a route handler, a use-case or the domain.

**The tactical half is applied where it pays, and "where" is decided by these questions, in this order:**

1. **Is the illegal state reachable?** A shape the type permits but no code path produces is a guard, not a
   defect. Protect it with the cheapest thing that turns it into a compile error or a failing assertion, and
   say in the commit that it is a guard.
2. **Does anyone read it?** Modelling a concept nothing consumes invents a type whose only reader is its own
   test.
3. **Does it cross a boundary?** A concept that leaves the domain, reaches a public payload, is persisted, or
   is written in two languages has earned a real type. One that lives inside a single function has not.

**Nothing but "no" means writing the rule instead of encoding it**: an assertion in the contract suite, a paragraph
in the folder's guide, or an ADR. A rule that is written down and mechanically checked is finished work, not
a deferred refactor.

### Practice by practice

| Practice | Verdict | The concrete reason, in this tree |
| --- | --- | --- |
| Ubiquitous language | **Taken whole** | The product's whole difficulty is that rival numbers share one word in ordinary speech, and the glossary retires that word outright. `CONTEXT.md` and its `_Avoid_` lists are the only thing separating PTO Day, Effective Day, Free Day and Bonus Day, and the contract suite fails on a retired term in the published wiki |
| Bounded contexts | **Taken whole** | Not for modelling reasons: the contexts run in different *runtimes*. `calendar/` is evaluated inside a Web Worker with no DOM and no server context, `payment/` never leaves the server. A shared type would be a shared runtime constraint |
| Layered architecture | **Taken, with the real graph published** | Layers with per-folder contracts. What is rejected is the *idealised* graph: the arrows are counted, not drawn, because a diagram read off the intent drifts back to the intent |
| Anti-corruption layer | **Taken, at exactly one seam** | `application/dto/`. The foreign vocabularies arrive (`date-holidays`, Stripe, `i18n-iso-countries`) and one glossary leaves. There is no second ACL and no need for one: nothing else in the tree consumes a foreign shape |
| Entities | **Rejected** | Nothing here has an identity that outlives its value. A Holiday is its date plus its Variant, a Bridge is its span, a Suggestion is its set of dates. The one thing with a lifecycle, a Donation, is a database row and is discussed under Aggregates |
| Value objects | **Rejected as types, taken as predicates** | Wrapping `PtoDays`, `Efficiency` or `Year` in a class buys nothing the arithmetic does not already give: they are numbers that are added, divided and formatted, and every operation on them is a number operation. What *is* taken is the membership test on a sealed union that crosses a boundary: `isFilterStrategy` and `isHolidayVariant`. That is question 3 answering yes where questions 1 and 2 also answer yes |
| Aggregates | **Rejected, and the invariant moved into SQL** | The one candidate is a payments row. Its invariant, *a succeeded row is the entitlement and can never be overwritten*, cannot be held by an in-memory aggregate root here: `TursoService` opens a connection per call, so nothing spans a read and a write, and concurrent webhook deliveries could both read `processing` and both write. `WHERE id = ? AND status != 'succeeded'` holds it atomically where a constructor could not |
| Repositories | **Rejected as a pattern; the file keeps the name** | `infrastructure/services/payments/repository.ts` is a table gateway: a handful of exported functions over one hand-written SQL statement each, against one table, with no aggregate to reconstitute and no collection illusion. Extracting an interface for it into the domain was weighed and rejected by ADR 0003, because the Effect service tag it composes against already is the substitution seam |
| Domain events | **Taken in part** | `PaymentSucceededEvent` and `PaymentFailedEvent` are real: they are built by a factory from a Stripe `PaymentIntent`, consumed by handlers that know nothing about webhooks, and they are the reason the payment rules are testable without a network. What is *not* taken is the machinery: no event bus, no store, no subscribers, no replay. `processWebhookEvent` is a `switch` over a couple of cases, and that does not need a dispatcher |
| Framework-free domain types | **Taken in one context, rejected in the other** | `calendar/` may not touch Effect, `@infrastructure/*` or anything unresolvable in a Web Worker. `payment/` composes Effect directly against infrastructure tags and holds `import type Stripe` in its event factory. Rival rules inside one layer, on purpose; [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md) is the whole argument |

### What the "ish" is, measured against the sibling repositories

The suffix is not a hedge and not an apology. It has a size, and the cheapest way to see it is that the same
maintainer runs the sibling repositories on the same conventions (the same `CONTEXT.md` glossary, the same
nested `CLAUDE.md` per folder, the same contract suite, the same Cloudflare Workers deploy), and each takes a
*different* amount of tactical DDD. Read against them, the "ish" here is a measurement rather than a mood.

| | forever-pto | biancafiore | contribKit |
| --- | --- | --- | --- |
| Implementations of the domain | one, TypeScript | one, TypeScript | **both: TypeScript on the web, Dart in the Flutter app** |
| Shape of `domain/` | bounded contexts, `calendar` and `payment` | one folder per concept (article, author, city, project, tag, testimonial), plus a `shared` one | `entities`, `value-objects`, `repositories`, `services` and `failures`, **mirrored in both languages** |
| Value objects | none | none | **taken in both languages**, including `Year`, `Username`, `Palette` and its own `Color` rather than Flutter's |
| Repository interfaces in `domain/` | rejected, [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md) | none | **taken, in both clients** |
| A neutral `shared/` tier | rejected, [ADR 0012](./0012-shared-date-helpers-stay-in-the-application-layer.md) | **taken**, holding dates, strings and a UI type | none |
| Layering recorded as a decision | this file | nothing in its ADR set | its own ADR, on both clients |

**The line that prices all of it is contribKit's, in its layering ADR:** *"A layered architecture is heavier
than a project of this size would normally justify. The reason to take that weight is the second
implementation, not the first."* That is the whole of the "ish". The ceremony is not paid for by the domain
being complicated; it is paid for by the number of implementations that have to stay comparable. contribKit
has one per language, and a value object is what lets `Year` mean the same thing on both sides of that
gap; its ADR names the cost in the same breath, that a one-line change there can touch a value object, a
repository interface and its implementation. forever-pto has one implementation, so there is no gap to hold
open and nothing for the wrapper to keep honest.

**The one place this tree does have a second implementation, it took the weight.** The planning pipeline runs
on the main thread and inside a Web Worker, and those callers used to be separate copies of the orchestration,
kept in step by a pair of mirrored test suites, until they drifted and one Planning Window produced
different plans depending on which path ran. The answer was not a value object; it was collapsing them onto
one `runPlanningPipeline` so the second implementation stopped existing. That is the same reasoning as
contribKit's, arriving at the opposite artefact because deleting the gap was available here and is not
available across TypeScript and Dart.

**biancafiore is the honest counter-example, and it is worth naming rather than hiding.** It has the neutral
`shared/` tier that ADR 0012 refused to create here, holding almost exactly what ADR 0012 said would move
into one. So the same maintainer put the same kind of module in different places in sibling repositories, and
the reason is not taste: the tier costs a path alias, an entry in every layer contract that enumerates what
it may import, a rule in the contract suite, and an answer to what else belongs there. biancafiore had none
of those contracts to update; this repository has every one of them. A reader who finds the trees side by side
should read that as the decision it is.

**One misreading to close before it starts, because the folder name invites it.** biancafiore has an
`application/entities/` folder and those are **not** DDD entities: they are Astro content collections, built
with `defineCollection`. The word there is the framework's, not the pattern's, and reading it as evidence
that the sibling models entities would be reading a directory listing instead of a file. contribKit's
`domain/entities` is a different matter and is genuinely part of its tactical kit; what it holds has not been
read for this comparison, so no claim is made about it beyond its existence.

### Worked examples from this repository

Each ran the questions in order. Some came out "encode it", the rest came out "write the rule". The
rejections matter as much as the fixes: a rule is only as clear as the cases it turned down.

1. **`HolidayVariant` crossing the rehydration boundary. Reachable: yes. Read: yes. Crosses: yes.**
   Persisted store state is obfuscated, not encrypted, so the `variant` of a stored Holiday is a string a
   user can edit and a string an older build may have written. Files read it outside `dto/`, nearly all of
   them by comparing against a member of the union, so a value outside it answers *no* everywhere and the
   Holiday silently drops out of the Summary counts, the composition pie, the year timeline and the table
   while still occupying its date. Yes on every question, so it earned code: `isHolidayVariant` beside the union, and a
   drop at the rehydration seam.
2. **The `succeeded` payment status, written once in TypeScript and again inside every SQL statement.
   Reachable: no, then yes. Read: yes. Crosses: yes.** The *word* is still Stripe's, and the SQL half of this
   is unchanged: a bound parameter in each statement would couple the SQL to a word Stripe cannot change and
   pay for it in statements that read less like the SQL they are, so that half stays an assertion, with a
   floor so a rewritten statement fails rather than emptying the set.

   The first question is what changed. It was answered *no* because "Stripe owns the value, so no code path
   here can produce a divergent one", and that reasoning skipped a step: nothing here produces one, but
   Stripe *sends* one. Its enums are documented as **open** — it adds values to them on an API version
   already pinned — and `stripe@22.6.1` made that explicit in the types by widening
   `PaymentIntent.Status` with its `OtherString` marker. Pinning `apiVersion` never bought what this example
   assumed it bought.

   So the answer is yes on all three, and the union earned code. What it did *not* earn is a sentinel: an
   eighth member would be a domain word for "Stripe said something we do not model", and the raw value —
   the only thing worth having when reconciling a payment — would be thrown away to make room for it.
   Nor an error path: a status this tree does not model must not turn a webhook into a retry loop, and the
   consumers already answer correctly without one, because every decision is *is it succeeded*, never
   *which of the seven is it*. The shape is to mirror upstream's contract instead of closing it:
   `PAYMENT_STATUSES` is the list this product reasons about, `PaymentStatus` is derived from it, and
   `ReportedPaymentStatus` is that union widened the same way Stripe widens its own. The value reaches the
   database exactly as Stripe sent it.

   Widening costs the exhaustiveness that made a misspelt comparison a type error, and two rules pay it
   back. One asserts `PAYMENT_STATUSES` still equals the union the installed SDK publishes, so a status
   Stripe adds fails the suite rather than sitting outside the list with every gate green. The other used to
   read "no module that *imports the constant* may spell the literal beside it", which made it blind to the
   file that needed it most: `confirmation/page.tsx` compared against a bare `"succeeded"` and imported
   nothing. It now reads every production module, with three exemptions that each mean a different thing by
   the word, and each exemption asserts it still does.
3. **A typed `HolidayId`. Reachable: no. Read: yes. Crosses: yes.** Its producers each build the string their
   own way: `national-<raw upstream date>`, `custom-<ISO datetime>` and `manual-<index>`. That looks like a
   value object asking to exist, and the collision it would prevent is unreachable: `addHoliday` refuses any
   date already held, so no Custom Holidays can share a day, and `holidayDTO.create` dedupes on the raw
   date string. One "no" on the first question is enough. The rule is written in
   [`../apps/web/src/application/dto/CLAUDE.md`](../apps/web/src/application/dto/CLAUDE.md) instead, and the
   defensive `${id}::${name}` composite key in `HolidaysTable.tsx` is the shape to notice: a downstream
   re-application of an invariant nobody had stated.
4. **`Efficiency` and `Gain` as distinct numeric types. Reachable: no. Read: yes. Crosses: yes.** They are
   measured against different denominators and coincide only when a plan spends its budget in full, so
   passing one where the other is wanted is a real error. No call site can make it: both arrive inside
   `Metrics` under their own field names and are read at separate call sites, so there is no position where
   either could be substituted. The rule lives in `CONTEXT.md`, which states both denominators and why they
   part company.
5. **A `Payment` aggregate root with an invariant-enforcing constructor. Reachable: yes. Read: yes.
   Crosses: yes, and still rejected.** Every question answers yes and the answer is still no, because the
   constructor could not hold the invariant. The rule is *a succeeded row can never be overwritten by a late
   or redelivered event*, and enforcing it in memory needs a read and a write inside one transaction, which
   this stack does not offer. It is one SQL predicate the database evaluates atomically. This is the example
   that shows the questions are a filter and not a licence.
6. **Repository interfaces extracted into `domain/payment/`. Rejected by ADR 0003 and restated here** because
   it is the proposal most likely to be made again by someone who reads the layer names and not the guides.
   The Effect service tags are already interfaces and tests already substitute them; adding a second set
   buys indirection with no substitutability gained.

## Consequences

- **These questions are the review script for a modelling change**, and the order matters. Question 1
  first, because an unreachable illegal state is the most common reason a proposed type is not worth its
  keep, and because a "guard" commit reads very differently from a "fix" commit.
- **A "no" answer is a deliverable, not a deferral.** The output is an assertion, a guide paragraph or an
  ADR, written in the same commit. This ADR is worth nothing if "write the rule" becomes a way of closing a
  finding without doing anything.
- **The published layer graph is now load-bearing.** It is asserted against the tree in both directions, so a
  new cross-layer import fails the contract suite until the table is updated. That is deliberate friction: a
  new edge between layers should cost one line of thought.
- **Nothing here reopens [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md) or
  [ADR 0012](./0012-shared-date-helpers-stay-in-the-application-layer.md).** Both are instances of this rule
  decided before it was written; this ADR states the rule they were following.
- **The cost is that "DDD" now names a shorter list than a reader expects.** Someone arriving with the book
  will find no aggregates, no repositories, no entities and no event bus, and will find that the domain
  imports upward in documented places. That is the intended state, and the practice table above is the answer to
  every one of those observations.
- **A reader coming from contribKit will find this tree noticeably lighter, and that is the same rule, not a
  different one.** The sibling comparison above is the check to re-run if this repository ever grows a second
  implementation of the planning engine in another language or another runtime that cannot be collapsed into
  the first. At that point the value objects and the repository interfaces start paying, and this ADR is
  superseded rather than amended.
- **The cost that is harder to see: a rule written and mechanically checked can still be the wrong rule.**
  The contract suite can tell you that the graph table matches the tree. It cannot tell you that an edge
  should not exist. That judgement stays with the layer contracts under
  [`../apps/web/src/`](../apps/web/src), and with review.
- Where this bites elsewhere: the *Conventions* section of [`../CLAUDE.md`](../CLAUDE.md), the layer
  contracts under [`../apps/web/src/`](../apps/web/src), and the architecture overview on the documentation
  site, which links here rather than restating any of it.
