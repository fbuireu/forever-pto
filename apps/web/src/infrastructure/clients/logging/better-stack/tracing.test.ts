import { describe, expect, it } from "vitest";
import pkg from "../../../../../package.json";
import { LOG_SERVICE } from "./contract";
import { TRACE_SAMPLING_RATIO, TRACES_PATH, tracingConfig } from "./tracing";

const env = {
	BETTER_STACK_INGESTING_URL: "https://s123.eu-fsn-3.betterstackdata.com",
	BETTER_STACK_SOURCE_TOKEN: "source-token",
};

describe("tracingConfig", () => {
	it("exports OTLP to the traces path of the same host the logs already go to", () => {
		const config = tracingConfig(env);

		expect("exporter" in config && config.exporter).toEqual({
			url: `https://s123.eu-fsn-3.betterstackdata.com${TRACES_PATH}`,
			headers: { Authorization: "Bearer source-token" },
		});
	});

	it("names the service the same way the logs do, so one query reaches both", () => {
		expect(tracingConfig(env).service).toEqual({ name: LOG_SERVICE, version: pkg.version });
	});

	it("head-samples at the ratio the constant states and lets no caller raise it through trace context", () => {
		expect(tracingConfig(env).sampling).toEqual({ headSampler: { ratio: TRACE_SAMPLING_RATIO, acceptRemote: false } });
		expect(TRACE_SAMPLING_RATIO).toBeGreaterThan(0);
		expect(TRACE_SAMPLING_RATIO).toBeLessThan(1);
	});

	it.each([
		["the host", { BETTER_STACK_SOURCE_TOKEN: "source-token" }],
		["the token", { BETTER_STACK_INGESTING_URL: "https://s123.eu-fsn-3.betterstackdata.com" }],
		["both", {}],
	])("drops every span when %s is unbound rather than exporting to a broken address", (_label, partial) => {
		const config = tracingConfig(partial);

		expect("exporter" in config).toBe(false);
		expect("spanProcessors" in config && config.spanProcessors).toEqual([]);
		expect(config.service.name).toBe(LOG_SERVICE);
	});
});
