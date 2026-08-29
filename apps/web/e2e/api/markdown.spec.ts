import { MARKDOWN_ACCEPT, MARKDOWN_PATH_HEADER, MARKDOWN_ROUTE } from "@infrastructure/markdown/twin";
import { expect, test } from "@playwright/test";

const MARKDOWN_HEADERS = { Accept: MARKDOWN_ACCEPT };
const HOME_PATH = "/";
const PLANNER_PATH = "/planner";
const TERMS_PATH = "/legal/terms-of-service";
const UNLISTED_PATH = "/totally-made-up-xyz";
const PLANNER_MARKER = "## How to Use";
const HOME_MARKER = "## How It Works";

test.describe("Markdown twin of a page route", () => {
	test("returns 200", async ({ request }) => {
		const response = await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS });
		expect(response.status()).toBe(200);
	});

	test("returns text/markdown content-type", async ({ request }) => {
		const response = await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS });
		expect(response.headers()["content-type"]).toContain(MARKDOWN_ACCEPT);
	});

	test("sets a public, hour-long Cache-Control", async ({ request }) => {
		const cacheControl = (await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS })).headers()["cache-control"];
		expect(cacheControl).toContain("public");
		expect(cacheControl).toContain("max-age=3600");
		expect(cacheControl).not.toContain("no-store");
	});

	test("varies on Accept", async ({ request }) => {
		const response = await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS });
		expect(response.headers().vary).toContain("Accept");
	});

	test("returns a document opening on a top-level heading", async ({ request }) => {
		const text = await (await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS })).text();
		expect(text.length).toBeGreaterThan(0);
		expect(text.trimStart()).toMatch(/^# \S/);
	});

	test("serves the requested path rather than the homepage", async ({ request }) => {
		const text = await (await request.get(PLANNER_PATH, { headers: MARKDOWN_HEADERS })).text();
		expect(text).toContain(PLANNER_MARKER);
		expect(text).not.toContain(HOME_MARKER);
	});

	test("serves the homepage twin at the root", async ({ request }) => {
		const text = await (await request.get(HOME_PATH, { headers: MARKDOWN_HEADERS })).text();
		expect(text).toContain(HOME_MARKER);
		expect(text).not.toContain(PLANNER_MARKER);
	});

	test("returns HTML when Accept does not ask for markdown", async ({ request }) => {
		const response = await request.get(PLANNER_PATH, { headers: { Accept: "text/html" } });
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("text/html");
	});
});

test.describe("Markdown twin of a path no route names", () => {
	test("returns 404", async ({ request }) => {
		const response = await request.get(UNLISTED_PATH, { headers: MARKDOWN_HEADERS });
		expect(response.status()).toBe(404);
	});

	test("returns text/plain rather than markdown", async ({ request }) => {
		const response = await request.get(UNLISTED_PATH, { headers: MARKDOWN_HEADERS });
		expect(response.headers()["content-type"]).toContain("text/plain");
	});

	test("sets Cache-Control: no-store", async ({ request }) => {
		const cacheControl = (await request.get(UNLISTED_PATH, { headers: MARKDOWN_HEADERS })).headers()["cache-control"];
		expect(cacheControl).toContain("no-store");
		expect(cacheControl).not.toContain("max-age=3600");
	});
});

test.describe(`GET ${MARKDOWN_ROUTE} direct`, () => {
	test("returns 404 with no path header", async ({ request }) => {
		const response = await request.get(MARKDOWN_ROUTE);
		expect(response.status()).toBe(404);
		expect(await response.text()).toBe("Not Found");
	});

	test("does not let the miss be cached", async ({ request }) => {
		const cacheControl = (await request.get(MARKDOWN_ROUTE)).headers()["cache-control"];
		expect(cacheControl).toContain("no-store");
		expect(cacheControl).not.toContain("max-age=3600");
	});

	test("ignores a path header the caller supplied", async ({ request }) => {
		const response = await request.get(MARKDOWN_ROUTE, {
			headers: { ...MARKDOWN_HEADERS, [MARKDOWN_PATH_HEADER]: PLANNER_PATH },
		});
		expect(response.status()).toBe(404);
		expect(await response.text()).toBe("Not Found");
	});
});

test.describe("Markdown twin query string", () => {
	test("ignores a path in the query string", async ({ request }) => {
		const response = await request.get(`${PLANNER_PATH}?path=${TERMS_PATH}`, { headers: MARKDOWN_HEADERS });
		expect(response.status()).toBe(200);
		const text = await response.text();
		expect(text).toContain(PLANNER_MARKER);
		expect(text).not.toContain(TERMS_PATH);
	});
});
