import { USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserCountryFromCookie } from "./userCountry";

vi.mock("@infrastructure/proxy/cookie", async (importOriginal) => ({
	...(await importOriginal<typeof import("@infrastructure/proxy/cookie")>()),
	USER_COUNTRY_COOKIE: "visitor-country",
}));

const withCookie = (value: string) => vi.spyOn(document, "cookie", "get").mockReturnValue(value);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("getUserCountryFromCookie", () => {
	it("reads the country the edge detected, under the name the edge writes it by", () => {
		withCookie(`${USER_COUNTRY_COOKIE}=es`);

		expect(getUserCountryFromCookie()).toBe("es");
	});

	it("finds the cookie among the others rather than only as the first one", () => {
		withCookie(`sidebar_state=true; ${USER_COUNTRY_COOKIE}=fr; NEXT_LOCALE=fr`);

		expect(getUserCountryFromCookie()).toBe("fr");
	});

	it("does not mistake another cookie whose name ends the same way", () => {
		withCookie(`preferred-${USER_COUNTRY_COOKIE}=es`);

		expect(getUserCountryFromCookie()).toBeUndefined();
	});

	it("answers undefined rather than an empty string for an emptied cookie", () => {
		withCookie(`${USER_COUNTRY_COOKIE}=`);

		expect(getUserCountryFromCookie()).toBeUndefined();
	});

	it("answers undefined when there is no cookie at all", () => {
		withCookie("");

		expect(getUserCountryFromCookie()).toBeUndefined();
	});
});
