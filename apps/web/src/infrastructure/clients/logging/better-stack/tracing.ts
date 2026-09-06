import type { TraceConfig } from "@microlabs/otel-cf-workers";
import { ExportResultCode } from "@opentelemetry/core";
import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import pkg from "../../../../../package.json";
import { LOG_SERVICE } from "./contract";

export const TRACES_PATH = "/v1/traces";
export const TRACE_SAMPLING_RATIO = 0.2;

export const DROP_SPANS: SpanExporter = {
	export: (_spans, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
	shutdown: () => Promise.resolve(),
};

export interface TracingEnv {
	BETTER_STACK_INGESTING_URL?: string;
	BETTER_STACK_SOURCE_TOKEN?: string;
}

export const tracingConfig = (env: TracingEnv): TraceConfig => {
	const service = { name: LOG_SERVICE, version: pkg.version };
	const sampling = { headSampler: { ratio: TRACE_SAMPLING_RATIO, acceptRemote: false } };

	if (!env.BETTER_STACK_INGESTING_URL || !env.BETTER_STACK_SOURCE_TOKEN) {
		return { service, sampling, exporter: DROP_SPANS };
	}

	return {
		service,
		sampling,
		exporter: {
			url: `${env.BETTER_STACK_INGESTING_URL}${TRACES_PATH}`,
			headers: { Authorization: `Bearer ${env.BETTER_STACK_SOURCE_TOKEN}` },
		},
	};
};
