import { context as otelContext, TraceFlags, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { afterAll, describe, expect, it } from "vitest";
import { traceCorrelation } from "./correlation";

const contextManager = new AsyncLocalStorageContextManager();
otelContext.setGlobalContextManager(contextManager.enable());

afterAll(() => {
	contextManager.disable();
});

describe("traceCorrelation", () => {
	it("returns nothing outside a span, so a log off a request carries no empty ids", () => {
		expect(traceCorrelation()).toEqual({});
	});

	it("returns the active span's trace and span ids", () => {
		const spanContext = {
			traceId: "0af7651916cd43dd8448eb211c80319c",
			spanId: "b7ad6b7169203331",
			traceFlags: TraceFlags.SAMPLED,
		};

		const seen = otelContext.with(trace.setSpan(otelContext.active(), trace.wrapSpanContext(spanContext)), () =>
			traceCorrelation(),
		);

		expect(seen).toEqual({ traceId: spanContext.traceId, spanId: spanContext.spanId });
	});
});
