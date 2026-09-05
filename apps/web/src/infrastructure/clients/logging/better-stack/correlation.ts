import { trace } from "@opentelemetry/api";

export interface TraceCorrelation {
	traceId?: string;
	spanId?: string;
}

export const traceCorrelation = (): TraceCorrelation => {
	const span = trace.getActiveSpan();
	if (!span) return {};

	const { traceId, spanId } = span.spanContext();

	return { traceId, spanId };
};
