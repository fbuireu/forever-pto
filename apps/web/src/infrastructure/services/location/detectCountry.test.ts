import { describe, expect, it, vi } from "vitest";

const mockDetectCountryFromCDN = vi.hoisted(() => vi.fn<() => Promise<string>>());
const mockDetectCountryFromHeaders = vi.hoisted(() => vi.fn<() => string>());
const mockDetectCountryFromEgressIP = vi.hoisted(() => vi.fn<() => Promise<string>>());

vi.mock("./utils/strategies", () => ({
	CLOUDFLARE_COUNTRY_HEADER: "cf-ipcountry",
	detectCountryFromCDN: mockDetectCountryFromCDN,
	detectCountryFromHeaders: mockDetectCountryFromHeaders,
	detectCountryFromEgressIP: mockDetectCountryFromEgressIP,
}));

const { detectCountry } = await import("./detectCountry");

const onCloudflare = { headers: new Headers({ "cf-ipcountry": "ES" }) } as never;
const offCloudflare = { headers: new Headers() } as never;

describe("detectCountry", () => {
	it("returns the header result when non-empty, without any network call", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("es");
		expect(await detectCountry(onCloudflare)).toBe("es");
		expect(mockDetectCountryFromCDN).not.toHaveBeenCalled();
		expect(mockDetectCountryFromEgressIP).not.toHaveBeenCalled();
	});

	it("stops at a header Cloudflare could not resolve, because the fallbacks would locate the Worker, not the visitor", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("");
		expect(await detectCountry(onCloudflare)).toBe("");
		expect(mockDetectCountryFromCDN).not.toHaveBeenCalled();
		expect(mockDetectCountryFromEgressIP).not.toHaveBeenCalled();
	});

	it("falls back to the CDN when there is no header at all", async () => {
		mockDetectCountryFromCDN.mockResolvedValue("de");
		expect(await detectCountry(offCloudflare)).toBe("de");
		expect(mockDetectCountryFromEgressIP).not.toHaveBeenCalled();
	});

	it("falls back to the egress IP when the CDN returns empty too", async () => {
		mockDetectCountryFromCDN.mockResolvedValue("");
		mockDetectCountryFromEgressIP.mockResolvedValue("fr");
		expect(await detectCountry(offCloudflare)).toBe("fr");
	});

	it("returns empty string when every strategy fails", async () => {
		mockDetectCountryFromCDN.mockResolvedValue("");
		mockDetectCountryFromEgressIP.mockResolvedValue("");
		expect(await detectCountry(offCloudflare)).toBe("");
	});
});
