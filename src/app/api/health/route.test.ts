import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/api/response", async () => {
	const { NextResponse } = await import("next/server");
	return {
		noStore: (body: object, init?: ResponseInit) => {
			const res = NextResponse.json(body, init);
			res.headers.set("Cache-Control", "no-store");
			return res;
		},
	};
});

const { GET } = await import("./route");

describe("GET /api/health", () => {
	it("returns 200 with status ok", async () => {
		const response = await GET();
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.status).toBe("ok");
	});

	it("returns a valid ISO timestamp", async () => {
		const before = Date.now();
		const response = await GET();
		const after = Date.now();
		const body = await response.json();
		const ts = new Date(body.timestamp).getTime();
		expect(ts).toBeGreaterThanOrEqual(before);
		expect(ts).toBeLessThanOrEqual(after);
	});

	it("reports liveness only, without disclosing which secrets are configured", async () => {
		vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
		vi.stubEnv("TURSO_DATABASE_URL", "libsql://test.turso.io");
		vi.stubEnv("TURSO_AUTH_TOKEN", "token-abc");

		const response = await GET();
		const body = await response.json();

		expect(Object.keys(body)).toEqual(["status", "timestamp"]);
		expect(JSON.stringify(body)).not.toContain("sk_test_123");

		vi.unstubAllEnvs();
	});

	it("sets Cache-Control: no-store", async () => {
		const response = await GET();
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});
});
