import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOG_LEVEL, LOG_SERVICE, type LogLevel } from "./contract";
import { logger } from "./logger";

const spies = {
	info: vi.spyOn(console, "info").mockImplementation(() => {}),
	warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
	error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

const lineFrom = (level: LogLevel) => JSON.parse(spies[level].mock.calls[0]?.[0] as string);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("the platform is the transport", () => {
	it("writes one JSON line per call, which is what Cloudflare exports and attributes to the active span", () => {
		logger.info({ message: "payment created", context: { paymentIntentId: "pi_1" } });

		expect(spies.info).toHaveBeenCalledTimes(1);
		expect(lineFrom(LOG_LEVEL.INFO)).toMatchObject({
			message: "payment created",
			level: LOG_LEVEL.INFO,
			service: LOG_SERVICE,
			paymentIntentId: "pi_1",
		});
	});

	it.each(Object.values(LOG_LEVEL))("emits %s through the console method of its own name", (level) => {
		logger[level as LogLevel]({ message: "test event", context: { field: 1 } });

		expect(spies[level as LogLevel]).toHaveBeenCalledTimes(1);
		expect(lineFrom(level as LogLevel)).toMatchObject({ level, field: 1 });
		for (const other of Object.values(LOG_LEVEL)) {
			if (other !== level) expect(spies[other as LogLevel]).not.toHaveBeenCalled();
		}
	});

	it("has a method for every level the log contract names", () => {
		for (const level of Object.values(LOG_LEVEL)) {
			expect(typeof logger[level as LogLevel]).toBe("function");
		}
	});

	it("writes a line with no context at all rather than an empty object", () => {
		logger.info({ message: "bare" });

		expect(lineFrom(LOG_LEVEL.INFO)).toEqual({ service: LOG_SERVICE, level: LOG_LEVEL.INFO, message: "bare" });
	});
});

describe("a caller cannot relabel its own line", () => {
	it("keeps the level the method decided, whatever the context says", () => {
		logger.error({ message: "charge failed", context: { level: LOG_LEVEL.INFO } });

		expect(lineFrom(LOG_LEVEL.ERROR).level).toBe(LOG_LEVEL.ERROR);
	});

	it("keeps the message the caller passed, not one smuggled through the context", () => {
		logger.warn({ message: "the real message", context: { message: "the decoy" } });

		expect(lineFrom(LOG_LEVEL.WARN).message).toBe("the real message");
	});

	it("keeps the service name, so a line cannot claim to come from somewhere else", () => {
		logger.info({ message: "hello", context: { service: "not-this-app" } });

		expect(lineFrom(LOG_LEVEL.INFO).service).toBe(LOG_SERVICE);
	});

	it("still carries a level a logError caller put in its context under a different key", () => {
		logger.logError({ message: "boom", error: new Error("x"), context: { attemptedLevel: LOG_LEVEL.INFO } });

		expect(lineFrom(LOG_LEVEL.ERROR).attemptedLevel).toBe(LOG_LEVEL.INFO);
	});
});

describe("logger.logError", () => {
	it("includes error message, name and stack in context", () => {
		logger.logError({ message: "test event", error: new Error("boom") });

		const { error } = lineFrom(LOG_LEVEL.ERROR);
		expect(error.message).toBe("boom");
		expect(error.name).toBe("Error");
		expect(error.stack).toContain("Error: boom");
	});

	it("handles non-Error values", () => {
		logger.logError({ message: "test", error: "string error" });

		const { error } = lineFrom(LOG_LEVEL.ERROR);
		expect(error.message).toBe("string error");
		expect(error.name).toBe("UnknownError");
		expect(error.stack).toBeUndefined();
	});

	it("carries the own enumerable fields of an Error subclass beside the standard three", () => {
		const error = Object.assign(new Error("x"), { code: "card_declined" });

		logger.logError({ message: "test", error });

		expect(lineFrom(LOG_LEVEL.ERROR).error.code).toBe("card_declined");
	});

	it("merges caller context with error context", () => {
		logger.logError({ message: "test", error: new Error("x"), context: { requestId: "req-1" } });

		const line = lineFrom(LOG_LEVEL.ERROR);
		expect(line.requestId).toBe("req-1");
		expect(line.error.message).toBe("x");
	});
});

describe("a log never fails its caller", () => {
	it("swallows a context that cannot be serialised, rather than throwing from a store action", () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;

		expect(() => logger.info({ message: "round trip", context: circular })).not.toThrow();
		expect(spies.info).not.toHaveBeenCalled();
	});

	it("swallows a console that throws synchronously", () => {
		spies.error.mockImplementationOnce(() => {
			throw new Error("sink down");
		});

		expect(() => logger.error({ message: "still fine" })).not.toThrow();
	});
});

describe("url redaction", () => {
	it("strips the query string off a url in the log context, so a credential in it never reaches the sink", () => {
		logger.error({
			message: "activation failed",
			context: {
				url: "https://forever-pto.com/api/payment/activate?payment_intent_client_secret=redacted-in-fixture",
			},
		});

		const [line] = spies.error.mock.calls[0] as [string];
		expect(JSON.parse(line).url).toBe("https://forever-pto.com/api/payment/activate");
		expect(line).not.toContain("redacted-in-fixture");
	});

	it("strips it on the logError path too, whichever method emitted the line", () => {
		logger.logError({
			message: "activation failed",
			error: new Error("x"),
			context: { url: "https://forever-pto.com/en/payment/confirmation?payment_intent=pi_3Abc" },
		});

		expect(lineFrom(LOG_LEVEL.ERROR).url).toBe("https://forever-pto.com/en/payment/confirmation");
	});

	it("leaves a non-string url alone", () => {
		logger.info({ message: "no url", context: { url: 42 } });

		expect(lineFrom(LOG_LEVEL.INFO).url).toBe(42);
	});
});
