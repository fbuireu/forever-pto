import { describe, expect, it } from "vitest";
import { apiCatalog } from "./apiCatalog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe("apiCatalog", () => {
	it("anchors linkset to baseUrl", () => {
		const { linkset } = apiCatalog(BASE_URL);
		expect(linkset[0].anchor).toBe(BASE_URL);
	});

	it("points service-doc and status to /api/health", () => {
		const { linkset } = apiCatalog(BASE_URL);
		const entry = linkset[0];
		expect(entry["https://www.iana.org/assignments/link-relations/service-doc"][0].href).toBe(`${BASE_URL}/api/health`);
		expect(entry["https://www.iana.org/assignments/link-relations/status"][0].href).toBe(`${BASE_URL}/api/health`);
	});
});
