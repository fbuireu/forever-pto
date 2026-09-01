import { buildMarkdownPage } from "@infrastructure/markdown/buildMarkdownPage";
import { MARKDOWN_PATH_HEADER, NEUTRALISED_MARKDOWN_PATH } from "@infrastructure/markdown/twin";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn().mockResolvedValue({
		env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
	}),
}));

vi.mock("@infrastructure/markdown/buildMarkdownPage", () => ({
	buildMarkdownPage: vi.fn().mockResolvedValue("# Forever PTO\n\nMarkdown content"),
}));

const { GET } = await import("./route");

interface RequestParams {
	pathname?: string;
	url?: string;
}

const request = ({ pathname, url = "http://localhost/api/markdown" }: RequestParams = {}) =>
	new Request(url, { headers: pathname === undefined ? {} : { [MARKDOWN_PATH_HEADER]: pathname } });

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(buildMarkdownPage).mockResolvedValue("# Forever PTO\n\nMarkdown content");
});

describe("GET /api/markdown", () => {
	it("takes the path from the header the proxy set", async () => {
		await GET(request({ pathname: "/en/planner" }));

		expect(buildMarkdownPage).toHaveBeenCalledWith({
			baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
			pathname: "/en/planner",
		});
	});

	it("ignores a path in the query string, which the visitor controls and the rewrite does not carry", async () => {
		const response = await GET(
			request({ pathname: undefined, url: "http://localhost/api/markdown?path=/legal/terms-of-service" }),
		);

		expect(buildMarkdownPage).not.toHaveBeenCalled();
		expect(response.status).toBe(404);
	});

	it("prefers the header over a query string that disagrees with it", async () => {
		await GET(request({ pathname: "/planner", url: "http://localhost/api/markdown?path=/legal/terms-of-service" }));

		expect(buildMarkdownPage).toHaveBeenCalledWith({ baseUrl: process.env.NEXT_PUBLIC_SITE_URL, pathname: "/planner" });
	});

	it("answers 404 without reaching the builder when the header is absent", async () => {
		const response = await GET(request());

		expect(response.status).toBe(404);
		expect(buildMarkdownPage).not.toHaveBeenCalled();
	});

	it("answers 404 without reaching the builder when the proxy neutralised the header", async () => {
		const response = await GET(request({ pathname: NEUTRALISED_MARKDOWN_PATH }));

		expect(response.status).toBe(404);
		expect(buildMarkdownPage).not.toHaveBeenCalled();
	});

	it("answers 404 without reaching the builder for a header value that is not a path", async () => {
		const response = await GET(request({ pathname: "planner" }));

		expect(response.status).toBe(404);
		expect(buildMarkdownPage).not.toHaveBeenCalled();
	});

	it("answers 404 for a path the route table does not list, so the two representations agree", async () => {
		vi.mocked(buildMarkdownPage).mockResolvedValueOnce(null);

		const response = await GET(request({ pathname: "/does-not-exist" }));

		expect(response.status).toBe(404);
		expect(response.headers.get("Vary")).toBe("Accept");
	});

	it("leaves no 404 in a shared cache", async () => {
		vi.mocked(buildMarkdownPage).mockResolvedValueOnce(null);

		const response = await GET(request({ pathname: "/does-not-exist" }));

		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("returns 200 with text/markdown content-type", async () => {
		const response = await GET(request({ pathname: "/" }));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toContain("text/markdown");
	});

	it("sets Cache-Control with max-age", async () => {
		const response = await GET(request({ pathname: "/" }));

		expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
	});

	it("sets Vary: Accept so a shared cache does not serve markdown to an HTML request", async () => {
		const response = await GET(request({ pathname: "/" }));

		expect(response.headers.get("Vary")).toBe("Accept");
	});

	it("returns the built markdown content", async () => {
		const response = await GET(request({ pathname: "/" }));

		expect(await response.text()).toBe("# Forever PTO\n\nMarkdown content");
	});
});
