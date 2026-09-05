import {
	type AttributeValue,
	type Context as OtelContext,
	type Span as OtelSpan,
	SpanKind as OtelSpanKind,
	context as otelContext,
	type SpanContext,
	SpanStatusCode,
	TraceFlags,
	trace,
} from "@opentelemetry/api";
import { Cause, type Context, type Exit, Layer, Option, Tracer } from "effect";
import { LOG_SERVICE } from "./contract";

const NANOS_PER_SECOND = 1_000_000_000n;

const KINDS: Record<Tracer.SpanKind, OtelSpanKind> = {
	internal: OtelSpanKind.INTERNAL,
	server: OtelSpanKind.SERVER,
	client: OtelSpanKind.CLIENT,
	producer: OtelSpanKind.PRODUCER,
	consumer: OtelSpanKind.CONSUMER,
};

const toHrTime = (nanos: bigint): [number, number] => [
	Number(nanos / NANOS_PER_SECOND),
	Number(nanos % NANOS_PER_SECOND),
];

const toAttributeValue = (value: unknown): AttributeValue =>
	typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : String(value);

const isBridged = (span: Tracer.AnySpan): span is BridgedSpan => span instanceof BridgedSpan;

const spanContextOf = (span: Tracer.AnySpan): SpanContext =>
	isBridged(span)
		? span.otel.spanContext()
		: {
				traceId: span.traceId,
				spanId: span.spanId,
				traceFlags: span.sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
				isRemote: true,
			};

const parentContextOf = (parent: Option.Option<Tracer.AnySpan>): OtelContext => {
	const active = otelContext.active();

	if (Option.isNone(parent)) return active;
	if (isBridged(parent.value)) return trace.setSpan(active, parent.value.otel);

	return trace.setSpanContext(active, spanContextOf(parent.value));
};

interface BridgedSpanParams {
	name: string;
	parent: Option.Option<Tracer.AnySpan>;
	context: Context.Context<never>;
	links: ReadonlyArray<Tracer.SpanLink>;
	startTime: bigint;
	kind: Tracer.SpanKind;
	otel: OtelSpan;
}

class BridgedSpan implements Tracer.Span {
	readonly _tag = "Span";
	readonly name: string;
	readonly parent: Option.Option<Tracer.AnySpan>;
	readonly context: Context.Context<never>;
	readonly kind: Tracer.SpanKind;
	readonly otel: OtelSpan;
	readonly spanId: string;
	readonly traceId: string;
	readonly sampled: boolean;
	readonly attributes = new Map<string, unknown>();
	links: ReadonlyArray<Tracer.SpanLink>;
	status: Tracer.SpanStatus;

	constructor({ name, parent, context, links, startTime, kind, otel }: BridgedSpanParams) {
		const { spanId, traceId, traceFlags } = otel.spanContext();
		this.name = name;
		this.parent = parent;
		this.context = context;
		this.links = links;
		this.kind = kind;
		this.otel = otel;
		this.spanId = spanId;
		this.traceId = traceId;
		this.sampled = (traceFlags & TraceFlags.SAMPLED) === TraceFlags.SAMPLED;
		this.status = { _tag: "Started", startTime };
	}

	end(endTime: bigint, exit: Exit.Exit<unknown, unknown>): void {
		this.status = { _tag: "Ended", startTime: this.status.startTime, endTime, exit };

		if (exit._tag === "Failure" && !Cause.isInterruptedOnly(exit.cause)) {
			this.otel.setStatus({ code: SpanStatusCode.ERROR, message: Cause.pretty(exit.cause) });
		} else {
			this.otel.setStatus({ code: SpanStatusCode.OK });
		}

		this.otel.end(toHrTime(endTime));
	}

	attribute(key: string, value: unknown): void {
		this.attributes.set(key, value);
		this.otel.setAttribute(key, toAttributeValue(value));
	}

	event(name: string, startTime: bigint, attributes?: Record<string, unknown>): void {
		const converted = Object.fromEntries(Object.entries(attributes ?? {}).map(([k, v]) => [k, toAttributeValue(v)]));
		this.otel.addEvent(name, converted, toHrTime(startTime));
	}

	addLinks(links: ReadonlyArray<Tracer.SpanLink>): void {
		this.links = [...this.links, ...links];
		this.otel.addLinks(
			links.map((link) => ({
				context: spanContextOf(link.span),
				attributes: Object.fromEntries(Object.entries(link.attributes).map(([k, v]) => [k, toAttributeValue(v)])),
			})),
		);
	}
}

export const otelTracer: Tracer.Tracer = Tracer.make({
	span: (name, parent, context, links, startTime, kind) => {
		const otel = trace.getTracer(LOG_SERVICE).startSpan(
			name,
			{
				kind: KINDS[kind],
				startTime: toHrTime(startTime),
				links: links.map((link) => ({
					context: spanContextOf(link.span),
					attributes: Object.fromEntries(Object.entries(link.attributes).map(([k, v]) => [k, toAttributeValue(v)])),
				})),
			},
			parentContextOf(parent),
		);

		return new BridgedSpan({ name, parent, context, links, startTime, kind, otel });
	},
	context: (f, fiber) => {
		const current = fiber.currentSpan;

		if (current && isBridged(current)) {
			return otelContext.with(trace.setSpan(otelContext.active(), current.otel), f);
		}

		return f();
	},
});

export const TracerLive = Layer.setTracer(otelTracer);
