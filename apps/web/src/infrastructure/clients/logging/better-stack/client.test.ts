import { beforeEach, describe, expect, it, vi } from "vitest";
import { BetterStackClient, getBetterStackInstance } from "./client";
import { LOG_LEVEL, LOG_SERVICE, type LogLevel } from "./contract";

const spies = {
	debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
	info: vi.spyOn(console, "info").mockImplementation(() => {}),
	warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
	error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

const lineFrom = (level: LogLevel) => JSON.parse(spies[level].mock.calls[0]?.[0] as string);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getBetterStackInstance", () => {
	it("returns the same instance on repeated calls", () => {
		expect(getBetterStackInstance()).toBe(getBetterStackInstance());
	});

	it("returns a BetterStackClient", () => {
		expect(getBetterStackInstance()).toBeInstanceOf(BetterStackClient);
	});
});

describe("the platform is the transport", () => {
	it("writes one JSON line per call, which is what Cloudflare exports and attributes to the active span", () => {
		new BetterStackClient().info("payment created", { paymentIntentId: "pi_1" });

		expect(spies.info).toHaveBeenCalledTimes(1);
		expect(lineFrom(LOG_LEVEL.INFO)).toMatchObject({
			message: "payment created",
			level: LOG_LEVEL.INFO,
			service: LOG_SERVICE,
			paymentIntentId: "pi_1",
		});
	});

	it.each(Object.values(LOG_LEVEL))("emits %s through the console method of its own name", (level) => {
		new BetterStackClient()[level as LogLevel]("test event", { field: 1 });

		expect(spies[level as LogLevel]).toHaveBeenCalledTimes(1);
		expect(lineFrom(level as LogLevel)).toMatchObject({ level, field: 1 });
		for (const other of Object.values(LOG_LEVEL)) {
			if (other !== level) expect(spies[other as LogLevel]).not.toHaveBeenCalled();
		}
	});

	it("has a method for every level the log contract names", () => {
		const client = new BetterStackClient();

		for (const level of Object.values(LOG_LEVEL)) {
			expect(typeof client[level as LogLevel]).toBe("function");
		}
	});
});

describe("a caller cannot relabel its own line", () => {
	it("keeps the level the method decided, whatever the context says", () => {
		new BetterStackClient().error("charge failed", { level: LOG_LEVEL.INFO });

		expect(lineFrom(LOG_LEVEL.ERROR).level).toBe(LOG_LEVEL.ERROR);
	});

	it("keeps the message the caller passed, not one smuggled through the context", () => {
		new BetterStackClient().warn("the real message", { message: "the decoy" });

		expect(lineFrom(LOG_LEVEL.WARN).message).toBe("the real message");
	});

	it("keeps the service name, so a line cannot claim to come from somewhere else", () => {
		new BetterStackClient().info("hello", { service: "not-this-app" });

		expect(lineFrom(LOG_LEVEL.INFO).service).toBe(LOG_SERVICE);
	});

	it("still carries a level a logError caller put in its context under a different key", () => {
		new BetterStackClient().logError("boom", new Error("x"), { attemptedLevel: LOG_LEVEL.DEBUG });

		expect(lineFrom(LOG_LEVEL.ERROR).attemptedLevel).toBe(LOG_LEVEL.DEBUG);
	});
});

describe("BetterStackClient.logError", () => {
	it("includes error message, name and stack in context", () => {
		new BetterStackClient().logError("test event", new Error("boom"));

		const { error } = lineFrom(LOG_LEVEL.ERROR);
		expect(error.message).toBe("boom");
		expect(error.name).toBe("Error");
		expect(error.stack).toContain("Error: boom");
	});

	it("handles non-Error values", () => {
		new BetterStackClient().logError("test", "string error");

		const { error } = lineFrom(LOG_LEVEL.ERROR);
		expect(error.message).toBe("string error");
		expect(error.name).toBe("UnknownError");
		expect(error.stack).toBeUndefined();
	});

	it("merges caller context with error context", () => {
		new BetterStackClient().logError("test", new Error("x"), { requestId: "req-1" });

		const line = lineFrom(LOG_LEVEL.ERROR);
		expect(line.requestId).toBe("req-1");
		expect(line.error.message).toBe("x");
	});
});

describe("BetterStackClient.logDuration", () => {
	it("logs duration_ms and duration_seconds", () => {
		new BetterStackClient().logDuration("my-op", 250);

		const line = lineFrom(LOG_LEVEL.INFO);
		expect(line.message).toBe("my-op completed");
		expect(line.duration_ms).toBe(250);
		expect(line.duration_seconds).toBe(0.25);
	});
});

describe("BetterStackClient.measureAsync", () => {
	it("returns the function result", async () => {
		await expect(new BetterStackClient().measureAsync("op", async () => 42)).resolves.toBe(42);
	});

	it("rethrows errors thrown by the function", async () => {
		await expect(
			new BetterStackClient().measureAsync("op", async () => {
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");
	});

	it("logs success duration after a successful call", async () => {
		await new BetterStackClient().measureAsync("op", async () => "x");

		const line = lineFrom(LOG_LEVEL.INFO);
		expect(line.status).toBe("success");
		expect(typeof line.duration_ms).toBe("number");
	});

	it("logs error context when the function throws", async () => {
		await new BetterStackClient()
			.measureAsync("op", async () => {
				throw new Error("e");
			})
			.catch(() => {});

		expect(lineFrom(LOG_LEVEL.ERROR).status).toBe("error");
	});
});

describe("a log never fails its caller", () => {
	it("swallows a context that cannot be serialised, rather than throwing from a store action", () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;

		expect(() => new BetterStackClient().info("round trip", circular)).not.toThrow();
		expect(spies.info).not.toHaveBeenCalled();
	});

	it("swallows a console that throws synchronously", () => {
		spies.error.mockImplementationOnce(() => {
			throw new Error("sink down");
		});

		expect(() => new BetterStackClient().error("still fine")).not.toThrow();
	});
});

describe("BetterStackClient.withContext", () => {
	it("returns a new BetterStackClient instance", () => {
		const client = new BetterStackClient();
		const child = client.withContext({ requestId: "abc" });

		expect(child).toBeInstanceOf(BetterStackClient);
		expect(child).not.toBe(client);
	});

	it("child client includes the added context when logging", () => {
		new BetterStackClient().withContext({ requestId: "abc" }).info("test");

		expect(lineFrom(LOG_LEVEL.INFO).requestId).toBe("abc");
	});
});

describe("url redaction", () => {
	it("strips the query string off a url in the log context, so a credential in it never reaches the sink", () => {
		new BetterStackClient().error("activation failed", {
			url: "https://forever-pto.com/api/payment/activate?payment_intent_client_secret=redacted-in-fixture",
		});

		const [line] = spies.error.mock.calls[0] as [string];
		expect(JSON.parse(line).url).toBe("https://forever-pto.com/api/payment/activate");
		expect(line).not.toContain("redacted-in-fixture");
	});

	it("strips a url carried on the base context too", () => {
		new BetterStackClient()
			.withContext({ url: "https://forever-pto.com/en/payment/confirmation?payment_intent=pi_3Abc" })
			.warn("slow confirmation");

		expect(lineFrom(LOG_LEVEL.WARN).url).toBe("https://forever-pto.com/en/payment/confirmation");
	});

	it("leaves a non-string url alone", () => {
		new BetterStackClient().info("no url", { url: 42 });

		expect(lineFrom(LOG_LEVEL.INFO).url).toBe(42);
	});
});
