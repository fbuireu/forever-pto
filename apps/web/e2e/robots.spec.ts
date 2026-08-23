import { expect, test } from "@playwright/test";
import { LOCALES } from "src/infrastructure/i18n/locales";
import { localePath } from "src/infrastructure/i18n/utils/url";
import { privateRoutes } from "src/infrastructure/seo/routes";

const ROBOTS_URL = "/robots.txt";
const DISALLOW_PREFIX = "Disallow: ";
const STATIC_DISALLOW = "/_next/static/";

const disallowedPaths = (body: string): string[] =>
	body
		.split(/\r?\n/)
		.filter((line) => line.startsWith(DISALLOW_PREFIX))
		.map((line) => line.slice(DISALLOW_PREFIX.length).trim());

test.describe("robots.txt", () => {
	test("returns 200 with correct content-type", { tag: "@smoke" }, async ({ request }) => {
		const response = await request.get(ROBOTS_URL);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("text/plain");
	});

	test("allows all crawlers at root", async ({ request }) => {
		const body = await (await request.get(ROBOTS_URL)).text();
		expect(body).toMatch(/^User-agent:\s*\*/im);
		expect(body).toMatch(/^Allow:\s*\//im);
	});

	test("disallows _next/static", async ({ request }) => {
		const paths = disallowedPaths(await (await request.get(ROBOTS_URL)).text());
		expect(paths).toContain(STATIC_DISALLOW);
	});

	test("disallows every private route, fully expanded, for every locale", async ({ request }) => {
		const paths = disallowedPaths(await (await request.get(ROBOTS_URL)).text());
		for (const locale of LOCALES) {
			for (const { path } of privateRoutes()) {
				expect(paths).toContain(localePath({ locale, path }));
			}
		}
	});

	test("disallows nothing beyond _next/static and the locale-expanded private routes", async ({ request }) => {
		const paths = disallowedPaths(await (await request.get(ROBOTS_URL)).text());
		expect(paths).toHaveLength(LOCALES.length * privateRoutes().length + 1);
	});

	test("includes sitemap URL", async ({ request }) => {
		const body = await (await request.get(ROBOTS_URL)).text();
		expect(body).toContain("Sitemap:");
		expect(body).toContain("/sitemap.xml");
	});
});
