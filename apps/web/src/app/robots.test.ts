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

	it("disallows nothing, so a crawler fetches the scripts and styles a page renders with and reads every noindex", () => {
		expect(rule.disallow).toBeUndefined();
	});

	it("includes the sitemap URL", () => {
		expect(result.sitemap).toBe(`${BASE_URL}/sitemap.xml`);
	});
});
