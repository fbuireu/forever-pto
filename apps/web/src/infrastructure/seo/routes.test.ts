import { describe, expect, it } from "vitest";
import { indexableRoutes, isIndexable, privateRoutes, SITE_ROUTES } from "./routes";

describe("SITE_ROUTES", () => {
	it("splits cleanly into indexable and private, with nothing in both or neither", () => {
		expect(indexableRoutes().length + privateRoutes().length).toBe(SITE_ROUTES.length);
		expect(indexableRoutes().some((route) => privateRoutes().includes(route))).toBe(false);
	});

	it("gives every indexable route the hints the sitemap needs", () => {
		for (const route of indexableRoutes()) {
			expect(route.changeFrequency).toBeDefined();
			expect(route.priority).toBeDefined();
		}
	});

	it("lists no duplicate paths, which would double an entry in the sitemap", () => {
		const paths = SITE_ROUTES.map(({ path }) => path);

		expect(new Set(paths).size).toBe(paths.length);
	});
});

describe("isIndexable", () => {
	it("answers for a known public route", () => {
		expect(isIndexable("/planner")).toBe(true);
	});

	it("answers for a known private route", () => {
		expect(isIndexable("/payment/confirmation")).toBe(false);
	});

	it("treats the home path as its own entry rather than a missing one", () => {
		expect(isIndexable("")).toBe(true);
	});

	it("fails closed on a route nobody added, so a forgotten row is private and not public", () => {
		expect(isIndexable("/admin")).toBe(false);
	});
});
