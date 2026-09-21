import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserCountryFromCookie } from "./userCountry";

const withCookie = (value: string) => vi.spyOn(document, "cookie", "get").mockReturnValue(value);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("getUserCountryFromCookie", () => {
	it("reads the country the edge detected", () => {
		withCookie("user-country=es");

		expect(getUserCountryFromCookie()).toBe("es");
	});

	it("finds the cookie among the others rather than only as the first one", () => {
		withCookie("sidebar_state=true; user-country=fr; NEXT_LOCALE=fr");

		expect(getUserCountryFromCookie()).toBe("fr");
	});

	it("does not mistake another cookie whose name ends the same way", () => {
		withCookie("preferred-user-country=es");

		expect(getUserCountryFromCookie()).toBeUndefined();
	});

	it("answers undefined rather than an empty string for an emptied cookie", () => {
		withCookie("user-country=");

		expect(getUserCountryFromCookie()).toBeUndefined();
	});

	it("answers undefined when there is no cookie at all", () => {
		withCookie("");

		expect(getUserCountryFromCookie()).toBeUndefined();
	});
});
