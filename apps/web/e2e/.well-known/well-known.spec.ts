import { ApiError } from "@infrastructure/api/errors";
import { expect, test } from "@playwright/test";

const BASE = "/.well-known";
const PROTOTYPE_KEYS = ["constructor", "toString", "valueOf", "hasOwnProperty"];

test.describe(".well-known", () => {
	test.describe("api-catalog", () => {
		test("returns 200 with linkset+json content-type", async ({ request }) => {
			const res = await request.get(`${BASE}/api-catalog`);
			expect(res.status()).toBe(200);
			expect(res.headers()["content-type"]).toContain("application/linkset+json");
		});

		test("returns a valid linkset with anchor", async ({ request }) => {
			const { linkset } = await (await request.get(`${BASE}/api-catalog`)).json();
			expect(Array.isArray(linkset)).toBe(true);
			expect(linkset[0].anchor).toMatch(/^https?:\/\//);
		});
	});

	test.describe("mcp/server-card.json", () => {
		test("returns 200 with json content-type", async ({ request }) => {
			const res = await request.get(`${BASE}/mcp/server-card.json`);
			expect(res.status()).toBe(200);
			expect(res.headers()["content-type"]).toContain("application/json");
		});

		test("returns schemaVersion v1 and no capabilities", async ({ request }) => {
			const body = await (await request.get(`${BASE}/mcp/server-card.json`)).json();
			expect(body.schemaVersion).toBe("v1");
			expect(body.capabilities).toEqual({ resources: false, tools: false, prompts: false });
		});
	});

	test.describe("agent-skills/index.json", () => {
		test("returns 200 with json content-type", async ({ request }) => {
			const res = await request.get(`${BASE}/agent-skills/index.json`);
			expect(res.status()).toBe(200);
			expect(res.headers()["content-type"]).toContain("application/json");
		});

		test("returns skills array", async ({ request }) => {
			const { skills } = await (await request.get(`${BASE}/agent-skills/index.json`)).json();
			expect(Array.isArray(skills)).toBe(true);
			expect(skills.length).toBeGreaterThan(0);
		});
	});

	test("returns 404 for unknown paths", async ({ request }) => {
		const res = await request.get(`${BASE}/unknown`);
		expect(res.status()).toBe(404);
	});

	for (const key of PROTOTYPE_KEYS) {
		test(`returns 404 for the Object.prototype key ${key}`, async ({ request }) => {
			const res = await request.get(`${BASE}/${key}`);
			expect(res.status()).toBe(404);
			expect((await res.json()).error).toBe(ApiError.NOT_FOUND);
		});
	}

	test("serves security.txt from the static assets, not the catch-all", async ({ request }) => {
		const res = await request.get(`${BASE}/security.txt`);
		expect(res.status()).toBe(200);
		expect(res.headers()["content-type"]).toContain("text/plain");
		expect(await res.text()).toContain("Contact:");
	});
});
