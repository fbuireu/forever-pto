# 0. ADR template

Date: 2026-07-26

## Status

Template. Not a decision — copy this file, do not edit it in place.

## Context

Copy this file to `NNNN-kebab-title.md`, numbered one above the highest existing ADR. The `# N. Title` heading carries that same number and states the decision in one line; the file slug is the short form of it.

Write an ADR only when the decision is **hard to reverse**, **surprising without context** and **the result of a real trade-off**. All three, or it is not an ADR — an easily reversed choice will simply be reversed, an unsurprising one raises no question, and one with no alternative records nothing but "we did the obvious thing".

This section holds the forces, not the answer: what the situation was, what the alternatives were, and why the obvious option was not obviously right. Someone reading it two years from now has none of the context you have today — the constraint that made this hard is the part they will be missing.

## Decision

What was decided, in the present tense, as a rule the codebase follows: "the calendar domain stays pure", not "we decided to keep the calendar domain pure". Name the alternative that was rejected and why, since that is what stops it being re-proposed. Point at the code with symbol names rather than line numbers — a `file.ts:123` citation rots the moment anything above it moves.

## Consequences

What follows from this, including what it costs. The bullets someone needs before touching the code:

- What is now load-bearing and must not be removed, and what breaks if it is.
- What this makes harder, slower, or impossible. An ADR with no cost recorded is usually not describing a real trade-off.
- Where the decision bites in the rest of the docs — the Gotchas bullet in [`CLAUDE.md`](../../CLAUDE.md), the nested guide, the [`CONTEXT.md`](../../CONTEXT.md) entry that has to link back here. There is no index; an ADR nothing links to will not be read, and [`docs/docs-consistency.test.ts`](../docs-consistency.test.ts) fails on one that nothing outside `docs/adr/` links to.
