# infrastructure/workers

## Purpose

Web Worker for offloading the heavy PTO calculation pipeline off the main thread, keeping the UI responsive during computation.

## Communication protocol

The main thread sends a `CalculateSuggestionsRequest` (serialized) and receives a `WorkerResponse` discriminated union:

```
main thread                          worker
    |                                   |
    |── CalculateSuggestionsRequest ──▶ |
    |                                   | runs: generateSuggestions
    |                                   |       generateAlternatives
    |                                   |       generateMetrics
    |◀─── WorkerResponse (success) ──── |
    |    or WorkerResponse (error)       |
```

## Serialization

All `Date` objects are converted to ISO strings before crossing the worker boundary (structured clone handles primitives but not all Date edge cases). `serializers.ts` handles both directions.

## Files

| File | Contents |
| --- | --- |
| `worker.ts` | Worker entry point — receives message, runs pipeline, posts result |
| `types.ts` | `CalculateSuggestionsRequest`, `WorkerResponse`, and all serialized DTO types |
| `serializers.ts` | Serialize/deserialize functions for each domain object crossing the boundary |

## Non-obvious details

- Manual and excluded days from the UI store are converted into pseudo-holiday objects before being passed to the worker, so the calendar algorithms treat them as blocked days without needing to know about user edits.
- The worker catches all errors and posts a typed error response rather than letting the worker crash — the main thread always gets a `WorkerResponse`.
