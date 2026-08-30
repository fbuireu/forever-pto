import { WELL_KNOWN_CACHE_CONTROL, WELL_KNOWN_MISSING_CACHE_CONTROL } from "@infrastructure/well-known/slugs";
import { describe, expect, it, vi } from "vitest";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL as string;

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn().mockResolvedValue({
		env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
	}),
}));

const { GET } = await import("./route");

function makeContext(slug: string[]) {
	return { params: Promise.resolve({ slug }) };
}

describe("GET /.well-known/[...slug]", () => {
	it.each([
		[["api-catalog"], "application/linkset+json"],
		[["mcp", "server-card.json"], "application/json"],
		[["agent-skills", "index.json"], "application/json"],
	])("serves %s with the content type its document declares", async (slug, contentType) => {
		const response = await GET(new Request("http://localhost"), makeContext(slug));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(contentType);
		expect(response.headers.get("Cache-Control")).toBe(WELL_KNOWN_CACHE_CONTROL);
	});

	it("builds each document against the site URL from the Cloudflare context", async () => {
		const catalog = await (await GET(new Request("http://localhost"), makeContext(["api-catalog"]))).json();
		const card = await (await GET(new Request("http://localhost"), makeContext(["mcp", "server-card.json"]))).json();
		const index = await (
			await GET(new Request("http://localhost"), makeContext(["agent-skills", "index.json"]))
		).json();

		expect(catalog.linkset[0].anchor).toBe(BASE_URL);
		expect(card.serverInfo.url).toBe(BASE_URL);
		expect(index.skills.flatMap((skill: { url?: string }) => skill.url ?? [])).not.toHaveLength(0);
		for (const skill of index.skills as { url?: string }[]) {
			if (skill.url) expect(skill.url.startsWith(`${BASE_URL}/.well-known/`)).toBe(true);
		}
	});

	it("returns 404 for unknown paths", async () => {
		const response = await GET(new Request("http://localhost"), makeContext(["unknown"]));
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBeDefined();
	});

	it.each([["constructor"], ["toString"], ["hasOwnProperty"], ["valueOf"], ["__proto__"]])(
		"answers 404 for %s, which a plain object would have resolved to an inherited function",
		async (slug) => {
			const response = await GET(new Request("http://localhost"), makeContext([slug]));
			expect(response.status).toBe(404);
		},
	);

	it.each([["unknown"], ["mcp", "gone.json"], ["__proto__"]])(
		"states a cache policy on the 404 for %s, so no cache is left to guess a heuristic lifetime",
		async (...slug) => {
			const response = await GET(new Request("http://localhost"), makeContext(slug));

			expect(response.status).toBe(404);
			expect(response.headers.get("Cache-Control")).toBe(WELL_KNOWN_MISSING_CACHE_CONTROL);
		},
	);
});
