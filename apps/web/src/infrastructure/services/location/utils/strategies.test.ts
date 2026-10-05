import { DE, ES, FR } from "@infrastructure/i18n/locales";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/logging/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const mockGetCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: mockGetCloudflareContext,
}));

const { detectCountryFromCDN, detectCountryFromHeaders, detectCountryFromEgressIP, CLOUDFLARE_COUNTRY_HEADER } =
	await import("./strategies");

const { logger } = await import("@infrastructure/logging/logger");

const { UNIDENTIFIED_COUNTRY, TOR_COUNTRY } = await import("./normalize");

function makeRequest(country: string | null) {
	return { headers: { get: (header: string) => (header === CLOUDFLARE_COUNTRY_HEADER ? country : null) } } as never;
}

interface MakeResponseParams {
	ok: boolean;
	body: unknown;
}

function makeResponse({ ok, body }: MakeResponseParams) {
	return {
		ok,
		text: () => Promise.resolve(body as string),
		json: () => Promise.resolve(body),
	} as Response;
}

describe("detectCountryFromHeaders", () => {
	it("returns empty string when header is absent", () => {
		expect(detectCountryFromHeaders(makeRequest(null))).toBe("");
	});

	it("returns empty string for XX (unidentified)", () => {
		expect(detectCountryFromHeaders(makeRequest(UNIDENTIFIED_COUNTRY))).toBe("");
	});

	it("returns empty string for T1 (Tor)", () => {
		expect(detectCountryFromHeaders(makeRequest(TOR_COUNTRY))).toBe("");
	});

	it("returns lowercase country code for a valid header", () => {
		expect(detectCountryFromHeaders(makeRequest(ES.toUpperCase()))).toBe(ES);
	});

	it("keeps an already-lowercase code as it is", () => {
		expect(detectCountryFromHeaders(makeRequest("us"))).toBe("us");
	});
});

describe("detectCountryFromCDN", () => {
	beforeEach(() => {
		mockGetCloudflareContext.mockResolvedValue({ env: { NEXT_PUBLIC_SITE_URL: "https://test.com" } });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns the country code parsed from the CDN trace", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(makeResponse({ ok: true, body: `fl=123\nloc=${ES.toUpperCase()}\nts=1234` })),
		);
		expect(await detectCountryFromCDN()).toBe(ES);
	});

	it("lowercases the country code", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: true, body: `loc=${DE.toUpperCase()}\n` })));
		expect(await detectCountryFromCDN()).toBe(DE);
	});

	it("returns empty string when response is not ok", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: false, body: "" })));
		expect(await detectCountryFromCDN()).toBe("");
	});

	it("returns empty string when loc= line is absent", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: true, body: "fl=123\nts=456" })));
		expect(await detectCountryFromCDN()).toBe("");
	});

	it("returns empty string when getCloudflareContext throws", async () => {
		mockGetCloudflareContext.mockRejectedValue(new Error("no context"));
		expect(await detectCountryFromCDN()).toBe("");
	});

	it("returns empty string when fetch rejects", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
		expect(await detectCountryFromCDN()).toBe("");
	});

	it("logs the reason a refused trace failed as a string, since an Error serialises to nothing", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: false, body: "" })));

		await detectCountryFromCDN();

		expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
			message: "Error while detecting country from CDN",
			context: { reason: "Error while getting information from the CDN" },
		});
	});

	it("logs the message of the fetch that rejected, not Effect's own wording", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

		await detectCountryFromCDN();

		expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
			message: "Error while detecting country from CDN",
			context: { reason: "network error" },
		});
	});

	it("logs the message of the context lookup that rejected", async () => {
		mockGetCloudflareContext.mockRejectedValue(new Error("no context"));

		await detectCountryFromCDN();

		expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
			message: "Error while detecting country from CDN",
			context: { reason: "no context" },
		});
	});

	it("says nothing when the trace answers", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: true, body: `loc=${ES.toUpperCase()}\n` })));

		await detectCountryFromCDN();

		expect(logger.warn).not.toHaveBeenCalled();
	});

	it("never lets the per-visitor trace be served from a cache", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeResponse({ ok: true, body: `loc=${ES.toUpperCase()}\n` }));
		vi.stubGlobal("fetch", mockFetch);
		await detectCountryFromCDN();
		expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: "no-store" }));
	});
});

describe("detectCountryFromEgressIP", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns the country from geo lookup on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4" } }))
				.mockResolvedValueOnce(makeResponse({ ok: true, body: { country: FR.toUpperCase() } })),
		);
		expect(await detectCountryFromEgressIP()).toBe(FR);
	});

	it("never lets either per-caller lookup be served from a cache", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4" } }))
			.mockResolvedValueOnce(makeResponse({ ok: true, body: { country: FR.toUpperCase() } }));
		vi.stubGlobal("fetch", mockFetch);

		await detectCountryFromEgressIP();

		expect(mockFetch).toHaveBeenCalledTimes(2);
		for (const [, init] of mockFetch.mock.calls) {
			expect(init).toEqual(expect.objectContaining({ cache: "no-store" }));
		}
	});

	it("encodes the address before putting it in the lookup URL, since a third party supplied it", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4/../admin?x=1" } }))
			.mockResolvedValueOnce(makeResponse({ ok: true, body: { country: FR.toUpperCase() } }));
		vi.stubGlobal("fetch", mockFetch);

		await detectCountryFromEgressIP();

		expect(mockFetch.mock.calls[1]?.[0]).toBe(`https://ipinfo.io/${encodeURIComponent("1.2.3.4/../admin?x=1")}/json`);
	});

	it("returns empty string when ipify response is not ok", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse({ ok: false, body: {} })));
		expect(await detectCountryFromEgressIP()).toBe("");
	});

	it("returns empty string when ip field is missing", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(makeResponse({ ok: true, body: {} })));
		expect(await detectCountryFromEgressIP()).toBe("");
	});

	it("returns empty string when ipinfo response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4" } }))
				.mockResolvedValueOnce(makeResponse({ ok: false, body: {} })),
		);
		expect(await detectCountryFromEgressIP()).toBe("");
	});

	it("returns empty string when country field is absent from geo data", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4" } }))
				.mockResolvedValueOnce(makeResponse({ ok: true, body: {} })),
		);
		expect(await detectCountryFromEgressIP()).toBe("");
	});

	it("returns empty string when fetch rejects", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
		expect(await detectCountryFromEgressIP()).toBe("");
	});

	it.each([
		["a body that is not an object", null],
		["an ip that is not a string", { ip: 42 }],
	])("returns empty string without a geo lookup when ipify answers %s", async (_label, body) => {
		const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ ok: true, body }));
		vi.stubGlobal("fetch", mockFetch);

		expect(await detectCountryFromEgressIP()).toBe("");
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it.each([
		["a body that is not an object", null],
		["a country that is not a string", { country: 42 }],
	])("returns empty string when ipinfo answers %s", async (_label, body) => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(makeResponse({ ok: true, body: { ip: "1.2.3.4" } }))
				.mockResolvedValueOnce(makeResponse({ ok: true, body })),
		);
		expect(await detectCountryFromEgressIP()).toBe("");
	});
});
