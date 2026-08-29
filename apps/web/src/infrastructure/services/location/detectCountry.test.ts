import { describe, expect, it, vi } from "vitest";

const mockDetectCountryFromCDN = vi.hoisted(() => vi.fn<() => Promise<string>>());
const mockDetectCountryFromHeaders = vi.hoisted(() => vi.fn<() => string>());
const mockDetectCountryFromEgressIP = vi.hoisted(() => vi.fn<() => Promise<string>>());

vi.mock("./utils/strategies", () => ({
	detectCountryFromCDN: mockDetectCountryFromCDN,
	detectCountryFromHeaders: mockDetectCountryFromHeaders,
	detectCountryFromEgressIP: mockDetectCountryFromEgressIP,
}));

const { detectCountry } = await import("./detectCountry");

const mockRequest = {} as never;

describe("detectCountry", () => {
	it("returns the header result when non-empty, without any network call", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("es");
		expect(await detectCountry(mockRequest)).toBe("es");
		expect(mockDetectCountryFromCDN).not.toHaveBeenCalled();
		expect(mockDetectCountryFromEgressIP).not.toHaveBeenCalled();
	});

	it("falls back to the CDN when the header is empty", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("");
		mockDetectCountryFromCDN.mockResolvedValue("de");
		expect(await detectCountry(mockRequest)).toBe("de");
		expect(mockDetectCountryFromEgressIP).not.toHaveBeenCalled();
	});

	it("falls back to the egress IP when the header and the CDN both return empty", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("");
		mockDetectCountryFromCDN.mockResolvedValue("");
		mockDetectCountryFromEgressIP.mockResolvedValue("fr");
		expect(await detectCountry(mockRequest)).toBe("fr");
	});

	it("returns empty string when all strategies fail", async () => {
		mockDetectCountryFromHeaders.mockReturnValue("");
		mockDetectCountryFromCDN.mockResolvedValue("");
		mockDetectCountryFromEgressIP.mockResolvedValue("");
		expect(await detectCountry(mockRequest)).toBe("");
	});
});
