import { ES, LOCALE_COOKIE } from "@infrastructure/i18n/locales";
import { MARKDOWN_PATH_HEADER, MARKDOWN_ROUTE } from "@infrastructure/markdown/twin";
import { type NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockI18nResponse = {
	cookies: {
		get: vi.fn(),
		set: vi.fn(),
	},
};

const mockI18nProxy = vi.fn().mockReturnValue(mockI18nResponse);

vi.mock("next-intl/middleware", () => ({
	default: vi.fn(() => mockI18nProxy),
}));

vi.mock("@infrastructure/i18n/routing", () => ({
	routing: {},
}));

vi.mock("@infrastructure/proxy/location", () => ({
	location: vi.fn(({ response }: { response: NextResponse }) => Promise.resolve(response)),
}));

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const { config, middleware } = await import("./middleware");

interface MakeRequestParams {
	pathname: string;
	accept?: string;
	search?: string;
	extraHeaders?: Record<string, string>;
}

function makeRequest({ pathname, accept = "", search = "", extraHeaders = {} }: MakeRequestParams): NextRequest {
	const headers = new Headers(extraHeaders);
	if (accept) headers.set("accept", accept);

	return {
		headers,
		nextUrl: { pathname, searchParams: new URLSearchParams(search) },
		url: `${BASE_URL}${pathname}${search ? `?${search}` : ""}`,
	} as unknown as NextRequest;
}

type HeaderInit = { request: { headers: Headers } };

const rewrittenRequestHeaders = (spy: ReturnType<typeof vi.spyOn>): Headers =>
	(spy.mock.calls[0][1] as HeaderInit).request.headers;

const passedThroughRequestHeaders = (spy: ReturnType<typeof vi.spyOn>): Headers =>
	(spy.mock.calls[0][0] as HeaderInit).request.headers;

describe("config matcher", () => {
	const matchesPage = (pathname: string) => new RegExp(`^${config.matcher[0]}$`).test(pathname);

	it("matches page paths", () => {
		expect(matchesPage("/")).toBe(true);
		expect(matchesPage("/some-page")).toBe(true);
		expect(matchesPage(`/${ES}/planner`)).toBe(true);
	});

	it("excludes /api paths, and re-adds /api/markdown explicitly", () => {
		expect(matchesPage("/api/some-endpoint")).toBe(false);
		expect(matchesPage("/api/markdown")).toBe(false);
		expect(config.matcher).toContain("/api/markdown");
	});

	it("excludes dotted paths such as /.well-known/*", () => {
		expect(matchesPage("/.well-known/security.txt")).toBe(false);
	});

	it("excludes framework paths", () => {
		expect(matchesPage("/_next/static/chunk.js")).toBe(false);
		expect(matchesPage("/_vercel/insights")).toBe(false);
	});
});

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockI18nResponse.cookies.get.mockReturnValue(null);
	});

	describe("markdown rewrite", () => {
		it("rewrites markdown requests to the markdown route, carrying no query at all", async () => {
			const spy = vi.spyOn(NextResponse, "rewrite");
			const request = makeRequest({ pathname: "/some-page", accept: "text/markdown" });

			await middleware(request);

			expect(spy).toHaveBeenCalledOnce();
			const url = spy.mock.calls[0][0] as URL;
			expect(url.pathname).toBe(MARKDOWN_ROUTE);
			expect(url.search).toBe("");
		});

		it("passes the path as a request header, which is the only thing the route reads", async () => {
			const spy = vi.spyOn(NextResponse, "rewrite");

			await middleware(makeRequest({ pathname: "/es/planner", accept: "text/markdown" }));

			expect(rewrittenRequestHeaders(spy).get(MARKDOWN_PATH_HEADER)).toBe("/es/planner");
		});

		it("overwrites a path header the visitor sent, so the pathname cannot be spoofed", async () => {
			const spy = vi.spyOn(NextResponse, "rewrite");

			await middleware(
				makeRequest({
					pathname: "/planner",
					accept: "text/markdown",
					search: "",
					extraHeaders: { [MARKDOWN_PATH_HEADER]: "/legal/terms-of-service" },
				}),
			);

			expect(rewrittenRequestHeaders(spy).get(MARKDOWN_PATH_HEADER)).toBe("/planner");
		});

		it("does not rewrite non-markdown requests", async () => {
			const spy = vi.spyOn(NextResponse, "rewrite");
			const request = makeRequest({ pathname: "/some-page", accept: "text/html" });

			await middleware(request);

			expect(spy).not.toHaveBeenCalled();
		});

		it("states no cache policy of its own, because only the route knows whether the page exists", async () => {
			const response = await middleware(makeRequest({ pathname: "/some-page", accept: "text/markdown" }));

			expect(response.headers.get("Cache-Control")).toBeNull();
		});
	});

	describe("direct requests to the markdown route", () => {
		it("strips the path header, so the route cannot be driven from outside the rewrite", async () => {
			const spy = vi.spyOn(NextResponse, "next");

			await middleware(
				makeRequest({
					pathname: MARKDOWN_ROUTE,
					accept: "",
					search: "",
					extraHeaders: { [MARKDOWN_PATH_HEADER]: "/planner" },
				}),
			);

			expect(passedThroughRequestHeaders(spy).get(MARKDOWN_PATH_HEADER)).toBeNull();
		});

		it("does not run the i18n proxy", async () => {
			const request = makeRequest({ pathname: MARKDOWN_ROUTE, accept: "", search: "path=/" });

			await middleware(request);

			expect(mockI18nProxy).not.toHaveBeenCalled();
		});

		it("does not rewrite onto itself when the request also asks for markdown", async () => {
			const spy = vi.spyOn(NextResponse, "rewrite");

			await middleware(makeRequest({ pathname: MARKDOWN_ROUTE, accept: "text/markdown" }));

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe("payment confirmation redirect", () => {
		it("redirects /payment/confirmation to home when payment_intent is missing", async () => {
			const spy = vi.spyOn(NextResponse, "redirect");
			const request = makeRequest({ pathname: "/payment/confirmation" });

			await middleware(request);

			expect(spy).toHaveBeenCalledOnce();
			const url = spy.mock.calls[0][0] as URL;
			expect(url.pathname).toBe("/");
		});

		it("redirects locale-prefixed confirmation to the locale home when payment_intent is missing", async () => {
			const spy = vi.spyOn(NextResponse, "redirect");
			const request = makeRequest({ pathname: `/${ES}/payment/confirmation` });

			await middleware(request);

			expect(spy).toHaveBeenCalledOnce();
			const url = spy.mock.calls[0][0] as URL;
			expect(url.pathname).toBe(`/${ES}`);
		});

		it("does not redirect when payment_intent is present", async () => {
			const spy = vi.spyOn(NextResponse, "redirect");
			const request = makeRequest({
				pathname: "/payment/confirmation",
				accept: "",
				search: "payment_intent=pi_123&redirect_status=succeeded",
			});

			await middleware(request);

			expect(spy).not.toHaveBeenCalled();
		});

		it("keeps the redirect on this origin when the path is protocol-relative", async () => {
			const spy = vi.spyOn(NextResponse, "redirect");
			const request = makeRequest({ pathname: "//1234567890/payment/confirmation" });

			await middleware(request);

			expect(spy).toHaveBeenCalledOnce();
			const url = spy.mock.calls[0][0] as URL;
			expect(url.origin).toBe(new URL(request.url).origin);
			expect(url.pathname).toBe("/1234567890");
		});
	});

	describe("locale cookie policy", () => {
		it("pins the locale cookie to the one policy, and leaves it writable from the client", async () => {
			mockI18nResponse.cookies.get.mockReturnValue({ value: ES });
			const request = makeRequest({ pathname: `/${ES}` });

			await middleware(request);

			expect(mockI18nResponse.cookies.set).toHaveBeenCalledWith({
				name: LOCALE_COOKIE,
				value: ES,
				secure: true,
				sameSite: "lax",
				path: "/",
			});
		});

		it("writes no locale cookie of its own when next-intl set none", async () => {
			mockI18nResponse.cookies.get.mockReturnValue(null);
			const request = makeRequest({ pathname: "/" });

			await middleware(request);

			expect(mockI18nResponse.cookies.set).not.toHaveBeenCalled();
		});
	});
});
