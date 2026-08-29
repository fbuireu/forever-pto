import { detectCountry } from "@infrastructure/services/location/detectCountry";
import type { NextRequest, NextResponse } from "next/server";
import { setLocationCookie, USER_COUNTRY_COOKIE } from "./cookie";

interface MiddlewareParams {
	request: NextRequest;
	response: NextResponse;
}

export async function location({ request, response }: MiddlewareParams) {
	const knownCountry = request.cookies.get(USER_COUNTRY_COOKIE)?.value;

	if (knownCountry) {
		setLocationCookie({ response, country: knownCountry });

		return response;
	}

	const userCountry = await detectCountry(request);

	if (userCountry) {
		setLocationCookie({ response, country: userCountry });
	}

	return response;
}
