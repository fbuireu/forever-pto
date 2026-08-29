import { expect, test } from "@playwright/test";

const NONEXISTENT = "/this-route-does-not-exist-xyz";
const ROBOTS_URL = "/robots.txt";

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
});
