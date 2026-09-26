# 20. Strategies are objectives over the marginal gain

Date: 2026-09-26

## Status

Accepted.

## Context

A Strategy used to be an ordering. `findBridges` scored every Bridge on its own (`effectiveDays / ptoDaysNeeded`),
each Strategy sorted that list its own way, and one greedy walk took Bridges in that order while they fitted the
budget and shared no PTO Day. It was simple, it was fast, and it was measured against the wrong thing: the
value of a Bridge depends on what the plan already holds, and a sorted list cannot know that.

Run over the Spanish national calendar for 2026 with 22 PTO Days, the old engine showed the cost in numbers:

- **The walk counted shared Free Days more than once.** A Friday and the Monday after it are each worth three days
  on their own and four together. Optimized's walk believed its plan was worth 80 Effective Days; the Metrics,
  which take the union, measured 55.
- **Ties fell to the calendar.** Every Friday and Monday of the year scores 3.0, the sort was stable, and
  candidates are emitted in date order, so Optimized spent 10 of its 22 days on the Fridays and Mondays of
  January and February and left June to September empty.
- **Grouped ranked by the budget spent, not the break produced.** It took three-day runs at 2.0 before one-day
  Bridges at 4.0, and finished at 1.82, under the floor that defines a Bridge.
- **Balanced was Optimized with one exception.** Its score was nearly all Efficiency, its high-value tier could
  only ever hold three-day runs at 3.0 or better, so its extra efficiency clause and its bonus changed no order,
  and it produced the same plan as Optimized. Nothing in it spread days across the year, which is what its name,
  the FAQ and the sidebar all promised.
- **Alternatives were built to be worse.** They excluded every Bridge touching the Suggestion, which removed the
  best Bridges from all of them, and two of their seven orderings started from the worst Bridges on purpose.

The alternatives weighed were:

- **Fix each ordering in place**: a different sort key per Strategy, and a dedupe of Bridges sharing a weekend.
  It fixes Grouped's key and nothing else. A sort is computed before the walk starts, so it cannot see that a
  Bridge became cheaper or dearer once its neighbour was taken, which is the whole of the double count.
- **An exact optimiser** (integer programming or a knapsack over the candidates). It would find the best plan
  for a stated objective, and it needs a solver the Web Worker does not carry, a run time that grows with the
  budget, and an objective written as a single linear function, which Balanced's quarter share and Grouped's
  block cap are not.
- **Greedy on the marginal gain**: re-measure every candidate against the plan at each step and take the best.
  No new dependency, a cost of one pass over the candidates per Bridge taken, and any objective that can rank a
  candidate given the plan so far can be written.

## Decision

A Strategy is an `Objective` in `STRATEGY_OBJECTIVE`: a **marginal floor** and a **rank**, both applied by one
selector, `selectBridges`, to a `Candidate` measured against the plan built so far.

- The marginal gain is the days a Bridge's span adds to the days the plan already covers, divided by its PTO Days.
  A candidate under its Strategy's floor is not taken, and budget is left unspent rather than spent on it.
- Optimized ranks by the marginal gain, then the length of the break the Bridge ends up in, then its distance
  from the breaks already taken. Grouped ranks by the break's length up to `GROUPED_MAX_BLOCK_DAYS`, at the lower
  `BLOCK_MINIMUM` floor. Balanced gives each quarter an equal share of the budget first, then ranks by break
  length up to `BALANCED_MAX_BLOCK_DAYS`.
- Effective Days are measured the same way: the free streaks that contain a placed day, so what the selector
  believed it gained is exactly what the Metrics report.
- Alternatives run the other Strategies first, then the chosen one with one of the Suggestion's Rest Blocks taken
  away at a time, and are kept only when at least `ALTERNATIVES.MIN_DIFFERENCE` away from every plan already
  offered and never ahead of the Suggestion on Effective Days or Efficiency: the Suggestion is the
  recommendation, and an Alternative is a different shape of year that gives some of it up.

The exact optimiser is rejected, not deferred: the Strategies are not one linear objective, and a solver in the
Worker buys optimality for an objective the product does not have. The per-Strategy sort is rejected because it
cannot express the double count at all.

## Consequences

- The plans users see change for every Strategy. Over the calendar above, Optimized goes from 55 Effective Days to
  74 and spreads through the year; Grouped from 40 at 1.82 to 46 at 2.09 in blocks of up to 16 days; Balanced now
  differs from Optimized, at 50 days with a break in every quarter. `strategies.test.ts` pins the ordering of the
  three and that the selector's belief equals the Metrics.
- Selection is no longer a sort followed by a walk, so it costs a pass per Bridge taken rather than one sort. The
  gain, break length and distance are updated incrementally to keep it inside the Worker's budget; recomputing
  them from scratch on every step is the regression to watch for.
- A candidate is never worth more to a plan than on its own, so the search prunes at the lowest floor any
  Strategy applies and no lower. Lowering a Strategy's floor under `BLOCK_MINIMUM` means lowering that constant
  too, or the prune silently drops what the Strategy would have taken.
- An Alternative may now share Bridges with the Suggestion. "Distinct" is a distance, not disjointness, and the
  glossary's Alternative entry already said no more than that.
- Because the other Strategies' plans are seeds, the ceiling is load-bearing: without it a Grouped user is offered
  the Optimized plan with more days than their own. It is enforced in `generateAlternatives` and re-checked on the
  measured Metrics in `runPlanningPipeline`.
- The rules and their traps are in [`apps/web/src/domain/calendar/AGENTS.md`](../apps/web/src/domain/calendar/AGENTS.md);
  the wiki's planning algorithm page explains the three objectives to a reader.
