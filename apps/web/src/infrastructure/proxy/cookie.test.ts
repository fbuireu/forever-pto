import { isDetectedCountryCode } from "@infrastructure/services/location/utils/normalize";
import type { NextResponse } from "next/server";
import { describe, expect, it, type Mock, vi } from "vitest";
import { ONE_WEEK, setLocationCookie, USER_COUNTRY_COOKIE } from "./cookie";

const SPAIN = "es";
if (!isDetectedCountryCode(SPAIN)) throw new TypeError("The fixture is not a detected country code");

interface ResponseDouble {
	response: NextResponse;
	cookiesSet: Mock;
}

function makeResponse(): ResponseDouble {
	const cookiesSet = vi.fn();
	return { response: { cookies: { set: cookiesSet } } as never, cookiesSet };
}

describe("ONE_WEEK", () => {
	it("equals 604800 seconds", () => {
		expect(ONE_WEEK).toBe(604_800);
	});
});

describe("USER_COUNTRY_COOKIE", () => {
	it('is "user-country"', () => {
		expect(USER_COUNTRY_COOKIE).toBe("user-country");
	});
});

describe("setLocationCookie", () => {
	it("sets the cookie with the correct name and country value", () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, SPAIN, expect.any(Object));
	});

	it("sets httpOnly to false", () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, SPAIN, expect.objectContaining({ httpOnly: false }));
	});

	it("sets secure", () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, SPAIN, expect.objectContaining({ secure: true }));
	});

	it("sets sameSite strict", () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(
			USER_COUNTRY_COOKIE,
			SPAIN,
			expect.objectContaining({ sameSite: "strict" }),
		);
	});

	it("sets maxAge to ONE_WEEK", () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, SPAIN, expect.objectContaining({ maxAge: ONE_WEEK }));
	});

	it('sets path to "/"', () => {
		const { response, cookiesSet } = makeResponse();
		setLocationCookie({ response, country: SPAIN });
		expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, SPAIN, expect.objectContaining({ path: "/" }));
	});
});
