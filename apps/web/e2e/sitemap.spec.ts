import { expect, test } from "@playwright/test";
import { LOCALES } from "src/infrastructure/i18n/locales";
import { localePath } from "src/infrastructure/i18n/utils/url";
import { indexableRoutes } from "src/infrastructure/seo/routes";

const SITEMAP_URL = "/sitemap.xml";
const LOCATION = /<loc>([^<]*)<\/loc>/g;

const locations = (body: string): string[] => [...body.matchAll(LOCATION)].map(([, url]) => url);

const originUnderTest = (baseURL: string | undefined): string => (baseURL ?? "").replace(/\/+$/, "");

test.describe("sitemap.xml", () => {
	test("emits one entry per locale and indexable route", async ({ request }) => {
		const body = await (await request.get(SITEMAP_URL)).text();
		expect(locations(body)).toHaveLength(LOCALES.length * indexableRoutes().length);
	});

	test("lists every locale-expanded indexable route", async ({ request, baseURL }) => {
		const origin = originUnderTest(baseURL);
		expect(origin).not.toBe("");

		const urls = locations(await (await request.get(SITEMAP_URL)).text());
		for (const locale of LOCALES) {
			for (const { path } of indexableRoutes()) {
				expect(urls).toContain(`${origin}${localePath({ locale, path })}`);
			}
		}
	});
});
