import type { detectCountry } from "@infrastructure/services/location/detectCountry";
import { type DetectedCountryCode, isDetectedCountryCode } from "@infrastructure/services/location/utils/normalize";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const { mockDetectCountry } = vi.hoisted(() => ({
	mockDetectCountry: vi.fn<typeof detectCountry>(),
}));

const { mockSetLocationCookie } = vi.hoisted(() => ({
	mockSetLocationCookie: vi.fn(),
}));

vi.mock("@infrastructure/services/location/detectCountry", () => ({
	detectCountry: mockDetectCountry,
}));

vi.mock("./cookie", () => ({
	USER_COUNTRY_COOKIE: "user-country",
	setLocationCookie: mockSetLocationCookie,
}));

import { location } from "./location";

const SPAIN = "es";
const FRANCE = "fr";
if (!isDetectedCountryCode(SPAIN) || !isDetectedCountryCode(FRANCE)) {
	throw new TypeError("A fixture is not a detected country code");
}

interface MakeParamsParams {
	country?: DetectedCountryCode | "";
	cookieValue?: string;
}

interface RequestDouble {
	cookies: { get: Mock };
}

interface ResponseDouble {
	cookies: { set: Mock };
}

interface LocationDoubles {
	request: RequestDouble;
	response: ResponseDouble;
}

function makeParams({ country = "", cookieValue }: MakeParamsParams = {}): LocationDoubles {
	mockDetectCountry.mockResolvedValue(country);
	const response = { cookies: { set: vi.fn() } };
	const request = {
		cookies: { get: vi.fn().mockReturnValue(cookieValue ? { value: cookieValue } : undefined) },
	};
	return { request, response };
}

describe("location", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("always returns the response", async () => {
		const { request, response } = makeParams({ country: SPAIN });
		await expect(location({ request, response } as never)).resolves.toBe(response);
	});

	it("calls setLocationCookie with the detected country", async () => {
		const { request, response } = makeParams({ country: SPAIN });
		await location({ request, response } as never);
		expect(mockSetLocationCookie).toHaveBeenCalledWith({ response, country: SPAIN });
	});

	it("does not call setLocationCookie when no country is detected", async () => {
		const { request, response } = makeParams({ country: "" });
		await location({ request, response } as never);
		expect(mockSetLocationCookie).not.toHaveBeenCalled();
	});

	it("still returns the response when no country is detected", async () => {
		const { request, response } = makeParams({ country: "" });
		await expect(location({ request, response } as never)).resolves.toBe(response);
	});

	describe("when the country cookie is already present", () => {
		it("does not run detection", async () => {
			const { request, response } = makeParams({ country: FRANCE, cookieValue: SPAIN });
			await location({ request, response } as never);
			expect(mockDetectCountry).not.toHaveBeenCalled();
		});

		it("re-sets the cookie so the expiry window slides", async () => {
			const { request, response } = makeParams({ country: FRANCE, cookieValue: SPAIN });
			await location({ request, response } as never);
			expect(mockSetLocationCookie).toHaveBeenCalledWith({ response, country: SPAIN });
		});

		it("returns the response", async () => {
			const { request, response } = makeParams({ country: FRANCE, cookieValue: SPAIN });
			await expect(location({ request, response } as never)).resolves.toBe(response);
		});
	});

	describe.each([
		["upper case", "ES"],
		["a sentinel", "xx"],
		["three letters", "esp"],
		["a sentence", "es; Path=/; Domain=evil.example"],
	])("when the country cookie carries %s, which this app never wrote", (_label, cookieValue) => {
		it("detects afresh and never writes the cookie's own value back", async () => {
			const { request, response } = makeParams({ country: FRANCE, cookieValue });
			await location({ request, response } as never);
			expect(mockDetectCountry).toHaveBeenCalledOnce();
			expect(mockSetLocationCookie).toHaveBeenCalledExactlyOnceWith({ response, country: FRANCE });
		});
	});
});
