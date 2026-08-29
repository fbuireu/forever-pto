import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOG_LEVEL, type LogLevel } from "./contract";

const { mockLogtail, MockLogtail } = vi.hoisted(() => {
	const mockLogtail = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
	class MockLogtail {
		debug = mockLogtail.debug;
		info = mockLogtail.info;
		warn = mockLogtail.warn;
		error = mockLogtail.error;
	}
	return { mockLogtail, MockLogtail };
});

vi.mock("@logtail/edge", () => ({
	Logtail: vi.fn().mockImplementation(MockLogtail as unknown as () => InstanceType<typeof MockLogtail>),
}));

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn().mockReturnValue({ ctx: {} }),
}));

process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = "test-token";
process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL = "https://test.logtail.com";

const { BetterStackClient, getBetterStackInstance } = await import("./client");

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getBetterStackInstance", () => {
	it("returns the same instance on repeated calls", () => {
		const a = getBetterStackInstance();
		const b = getBetterStackInstance();
		expect(a).toBe(b);
	});

	it("returns a BetterStackClient", () => {
		expect(getBetterStackInstance()).toBeInstanceOf(BetterStackClient);
	});
});

describe("the level vocabulary", () => {
	it.each(Object.values(LOG_LEVEL))("emits %s under its own name, so no level folds onto another", (level) => {
		const client = new BetterStackClient();

		client[level as LogLevel]("test event", { field: 1 });

		expect(mockLogtail[level as LogLevel]).toHaveBeenCalledWith(
			"test event",
			expect.objectContaining({ field: 1 }),
			expect.anything(),
		);
		for (const other of Object.values(LOG_LEVEL)) {
			if (other !== level) expect(mockLogtail[other as LogLevel]).not.toHaveBeenCalled();
		}
	});

	it("has a method for every level the tail Worker's contract names", () => {
		const client = new BetterStackClient();

		for (const level of Object.values(LOG_LEVEL)) {
			expect(typeof client[level as LogLevel]).toBe("function");
		}
	});
});

describe("BetterStackClient.logError", () => {
	it("includes error message, name and stack in context", () => {
		const client = new BetterStackClient();
		const err = new Error("boom");
		client.logError("test event", err);
		const [, ctx] = mockLogtail.error.mock.calls[0];
		expect(ctx.error.message).toBe("boom");
		expect(ctx.error.name).toBe("Error");
		expect(ctx.error.stack).toContain("Error: boom");
	});

	it("handles non-Error values", () => {
		const client = new BetterStackClient();
		client.logError("test", "string error");
		const [, ctx] = mockLogtail.error.mock.calls[0];
		expect(ctx.error.message).toBe("string error");
		expect(ctx.error.name).toBe("UnknownError");
		expect(ctx.error.stack).toBeUndefined();
	});

	it("merges caller context with error context", () => {
		const client = new BetterStackClient();
		client.logError("test", new Error("x"), { requestId: "req-1" });
		const [, ctx] = mockLogtail.error.mock.calls[0];
		expect(ctx.requestId).toBe("req-1");
		expect(ctx.error.message).toBe("x");
	});
});

describe("BetterStackClient.logDuration", () => {
	it("logs duration_ms and duration_seconds", () => {
		const client = new BetterStackClient();
		client.logDuration("my-op", 250);
		const [msg, ctx] = mockLogtail.info.mock.calls[0];
		expect(msg).toBe("my-op completed");
		expect(ctx.duration_ms).toBe(250);
		expect(ctx.duration_seconds).toBe(0.25);
	});
});

describe("BetterStackClient.measureAsync", () => {
	it("returns the function result", async () => {
		const client = new BetterStackClient();
		const result = await client.measureAsync("op", async () => 42);
		expect(result).toBe(42);
	});

	it("rethrows errors thrown by the function", async () => {
		const client = new BetterStackClient();
		await expect(
			client.measureAsync("op", async () => {
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");
	});

	it("logs success duration after a successful call", async () => {
		const client = new BetterStackClient();
		await client.measureAsync("op", async () => "x");
		expect(mockLogtail.info).toHaveBeenCalled();
		const [, ctx] = mockLogtail.info.mock.calls[0];
		expect(ctx.status).toBe("success");
		expect(typeof ctx.duration_ms).toBe("number");
	});

	it("logs error context when the function throws", async () => {
		const client = new BetterStackClient();
		await client
			.measureAsync("op", async () => {
				throw new Error("e");
			})
			.catch(() => {});
		expect(mockLogtail.error).toHaveBeenCalled();
		const [, ctx] = mockLogtail.error.mock.calls[0];
		expect(ctx.status).toBe("error");
	});
});

describe("a log never fails its caller", () => {
	it("is a no-op when the BetterStack variables are absent", async () => {
		vi.resetModules();
		vi.stubEnv("NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN", "");
		vi.stubEnv("NEXT_PUBLIC_BETTER_STACK_INGESTING_URL", "");
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const { BetterStackClient: Unconfigured } = await import("./client");
		const client = new Unconfigured();

		expect(() => client.info("hello")).not.toThrow();
		expect(() => client.logError("boom", new Error("x"))).not.toThrow();
		expect(mockLogtail.info).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledTimes(1);

		warn.mockRestore();
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("swallows a transport that throws synchronously", async () => {
		vi.resetModules();
		mockLogtail.error.mockImplementationOnce(() => {
			throw new Error("transport down");
		});

		const { BetterStackClient: Fresh } = await import("./client");
		expect(() => new Fresh().error("still fine")).not.toThrow();

		vi.resetModules();
	});
});

describe("BetterStackClient.withContext", () => {
	it("returns a new BetterStackClient instance", () => {
		const client = new BetterStackClient();
		const child = client.withContext({ traceId: "abc" });
		expect(child).toBeInstanceOf(BetterStackClient);
		expect(child).not.toBe(client);
	});

	it("child client includes the added context when logging", () => {
		const client = new BetterStackClient();
		const child = client.withContext({ traceId: "abc" });
		child.info("test");
		const [, ctx] = mockLogtail.info.mock.calls[0];
		expect(ctx.traceId).toBe("abc");
	});
});

describe("url redaction", () => {
	it("strips the query string off a url in the log context, so a credential in it never reaches the sink", () => {
		new BetterStackClient().error("activation failed", {
			url: "https://forever-pto.com/api/payment/activate?payment_intent_client_secret=redacted-in-fixture",
		});

		const [, ctx] = mockLogtail.error.mock.calls[0];
		expect(ctx.url).toBe("https://forever-pto.com/api/payment/activate");
		expect(JSON.stringify(ctx)).not.toContain("redacted-in-fixture");
	});

	it("strips a url carried on the base context too", () => {
		new BetterStackClient()
			.withContext({ url: "https://forever-pto.com/en/payment/confirmation?payment_intent=pi_3Abc" })
			.warn("slow confirmation");

		const [, ctx] = mockLogtail.warn.mock.calls[0];
		expect(ctx.url).toBe("https://forever-pto.com/en/payment/confirmation");
	});

	it("leaves a non-string url alone", () => {
		new BetterStackClient().info("no url", { url: 42 });

		const [, ctx] = mockLogtail.info.mock.calls[0];
		expect(ctx.url).toBe(42);
	});
});
