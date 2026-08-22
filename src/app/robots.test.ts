import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { privateRoutes, SITE_ROUTES } from "@infrastructure/seo/routes";
import type { MetadataRoute } from "next";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn().mockResolvedValue({
		env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
	}),
}));

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const { default: robots } = await import("./robots");

type UnwrapRules<T> = T extends Array<infer U> ? U : T;
type RobotsRule = UnwrapRules<MetadataRoute.Robots["rules"]>;

let result: MetadataRoute.Robots;
let rule: RobotsRule;

beforeAll(async () => {
	result = await robots();
	[rule] = Array.isArray(result.rules) ? result.rules : [result.rules];
});

describe("robots", () => {
	it("returns a single wildcard rule", () => {
		expect(result.rules).toHaveLength(1);
		expect(rule).toMatchObject({ userAgent: "*", allow: "/" });
	});

	it("disallows _next/static", () => {
		expect(rule.disallow).toContain("/_next/static/");
	});

	it("disallows every private route, in every locale", () => {
		for (const locale of LOCALES) {
			for (const { path } of privateRoutes()) {
				expect(rule.disallow).toContain(localePath(locale, path));
			}
		}
	});

	it("never disallows a route the sitemap advertises", () => {
		const indexable = SITE_ROUTES.filter((route) => route.indexable);

		for (const locale of LOCALES) {
			for (const { path } of indexable) {
				expect(rule.disallow).not.toContain(localePath(locale, path));
			}
		}
	});

	it("includes the sitemap URL", () => {
		expect(result.sitemap).toBe(`${BASE_URL}/sitemap.xml`);
	});
});
