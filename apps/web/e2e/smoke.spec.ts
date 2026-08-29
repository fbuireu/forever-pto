import { expect, test } from "@playwright/test";

const NONEXISTENT = "/this-route-does-not-exist-xyz";
const ROBOTS_URL = "/robots.txt";
const SITEMAP_URL = "/sitemap.xml";
const HEALTH_URL = "/api/health";
const LOCATION = /<loc>([^<]*)<\/loc>/g;

test.describe("smoke", () => {
	test("an unknown path answers 404 @smoke", async ({ page }) => {
		const response = await page.goto(NONEXISTENT);
		expect(response?.status()).toBe(404);
	});

	test("robots.txt answers 200 as plain text @smoke", async ({ request }) => {
		const response = await request.get(ROBOTS_URL);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("text/plain");
	});

	test("the sitemap answers 200 as XML @smoke", async ({ request }) => {
		const response = await request.get(SITEMAP_URL);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("application/xml");
	});

	test("the sitemap names the host under test @smoke", async ({ request, baseURL }) => {
		const origin = (baseURL ?? "").replace(/\/+$/, "");
		expect(origin).not.toBe("");

		const body = await (await request.get(SITEMAP_URL)).text();
		for (const [, url] of body.matchAll(LOCATION)) {
			expect(url.startsWith(`${origin}/`)).toBe(true);
		}
	});

	test("the health endpoint answers 200 @smoke", async ({ request }) => {
		const response = await request.get(HEALTH_URL);
		expect(response.status()).toBe(200);
	});
});
