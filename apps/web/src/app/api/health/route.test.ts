import { afterEach, describe, expect, it, vi } from "vitest";

const { GET } = await import("./route");

describe("GET /api/health", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns 200 with status ok", async () => {
		const response = await GET();
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.status).toBe("ok");
	});

	it("stamps the answer with the current instant as an ISO string", async () => {
		const now = new Date("2026-04-14T10:30:00.000Z");
		vi.useFakeTimers({ now, toFake: ["Date"] });
		try {
			const body = await (await GET()).json();
			expect(body.timestamp).toBe(now.toISOString());
		} finally {
			vi.useRealTimers();
		}
	});

	it("reports liveness only, without disclosing which secrets are configured", async () => {
		vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
		vi.stubEnv("TURSO_DATABASE_URL", "libsql://test.turso.io");
		vi.stubEnv("TURSO_AUTH_TOKEN", "token-abc");

		const response = await GET();
		const body = await response.json();

		expect(Object.keys(body)).toEqual(["status", "timestamp"]);
		expect(JSON.stringify(body)).not.toContain("sk_test_123");
	});

	it("sets Cache-Control: no-store", async () => {
		const response = await GET();
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});
});
