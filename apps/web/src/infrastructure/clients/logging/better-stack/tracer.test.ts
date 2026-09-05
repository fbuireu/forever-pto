import { context as otelContext, SpanStatusCode, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Effect } from "effect";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { LOG_SERVICE } from "./contract";
import { TracerLive } from "./tracer";

const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
const contextManager = new AsyncLocalStorageContextManager();

trace.setGlobalTracerProvider(provider);
otelContext.setGlobalContextManager(contextManager.enable());

const run = <A, E>(program: Effect.Effect<A, E>) => Effect.runPromise(program.pipe(Effect.provide(TracerLive)));
const exported = () => exporter.getFinishedSpans();
const named = (name: string) => exported().find((span) => span.name === name);

beforeEach(() => {
	exporter.reset();
});

afterAll(async () => {
	await provider.shutdown();
	contextManager.disable();
});

describe("the Effect tracer exports through the OpenTelemetry tracer the Worker wrapper registers", () => {
	it("exports a use case's span under the name withSpan gives it, on the service the logs name", async () => {
		await run(Effect.void.pipe(Effect.withSpan("createPayment")));

		const span = named("createPayment");
		expect(span?.instrumentationScope.name).toBe(LOG_SERVICE);
		expect(span?.status.code).toBe(SpanStatusCode.OK);
	});

	it("nests the program's span under whatever OpenTelemetry span is active when it runs", async () => {
		const root = trace.getTracer("test").startSpan("request");

		await otelContext.with(trace.setSpan(otelContext.active(), root), () =>
			run(Effect.void.pipe(Effect.withSpan("createPayment"))),
		);
		root.end();

		expect(named("createPayment")?.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
	});

	it("makes the program's span the active context inside it, so an instrumented fetch would nest under it", async () => {
		const activeInside = await run(
			Effect.sync(() => trace.getSpan(otelContext.active())?.spanContext().spanId).pipe(
				Effect.withSpan("createPayment"),
			),
		);

		expect(activeInside).toBe(named("createPayment")?.spanContext().spanId);
	});

	it("parents a nested Effect span on the enclosing one", async () => {
		await run(Effect.void.pipe(Effect.withSpan("inner"), Effect.withSpan("outer")));

		expect(named("inner")?.parentSpanContext?.spanId).toBe(named("outer")?.spanContext().spanId);
	});

	it("marks a failed program's span as an error carrying the cause", async () => {
		await run(Effect.fail(new Error("boom")).pipe(Effect.withSpan("createPayment"), Effect.ignore));

		const span = named("createPayment");
		expect(span?.status.code).toBe(SpanStatusCode.ERROR);
		expect(span?.status.message).toContain("boom");
	});

	it("carries span annotations and events across as attributes and events", async () => {
		await run(
			Effect.gen(function* () {
				yield* Effect.annotateCurrentSpan("paymentId", "pi_123");
				yield* Effect.annotateCurrentSpan("attempt", 2);
				yield* Effect.annotateCurrentSpan("shape", { nested: true });
				yield* Effect.logInfo("charged");
			}).pipe(Effect.withSpan("createPayment")),
		);

		const span = named("createPayment");
		expect(span?.attributes).toMatchObject({ paymentId: "pi_123", attempt: 2, shape: "[object Object]" });
		expect(span?.events.map((event) => event.name)).toContain("charged");
	});

	it("links a span to another one it names", async () => {
		const other = await run(Effect.currentSpan.pipe(Effect.withSpan("other")));

		await run(
			Effect.void.pipe(Effect.withSpan("linked", { links: [{ _tag: "SpanLink", span: other, attributes: {} }] })),
		);

		expect(named("linked")?.links[0]?.context.spanId).toBe(named("other")?.spanContext().spanId);
	});
});
