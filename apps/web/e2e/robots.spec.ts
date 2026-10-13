import { expect, test } from "./fixtures";

const ROBOTS_URL = "/robots.txt";

test.describe("robots.txt", () => {
	test("allows all crawlers at root", async ({ request }) => {
		const body = await (await request.get(ROBOTS_URL)).text();
		expect(body).toMatch(/^User-agent:\s*\*/im);
		expect(body).toMatch(/^Allow:\s*\//im);
	});

	test("disallows nothing, so _next/static stays fetchable and every noindex page stays crawlable", async ({
		request,
	}) => {
		const body = await (await request.get(ROBOTS_URL)).text();
		expect(body).not.toMatch(/^Disallow:/im);
	});

	test("includes sitemap URL", async ({ request }) => {
		const body = await (await request.get(ROBOTS_URL)).text();
		expect(body).toContain("Sitemap:");
		expect(body).toContain("/sitemap.xml");
	});
});
