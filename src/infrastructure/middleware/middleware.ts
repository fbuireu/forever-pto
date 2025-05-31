import { isPremium } from "@application/actions/premium";
import { DEFAULT_QUERY_PARAMS, FILTER_MAXIMUM_VALUES, SEARCH_PARAM_KEYS } from "@const/const";
import type { RequiredParamsMap } from "@const/types";
import { validateParam } from "@infrastructure/middleware/utils/validateParam/validateParam";
import { detectLocation } from "@infrastructure/services/location/detectLocation/detectLocation";
import { type NextRequest, NextResponse } from "next/server";

export const MIDDLEWARE_PARAMS: RequiredParamsMap = {
	[SEARCH_PARAM_KEYS.COUNTRY]: async (request: NextRequest) => await detectLocation(request),
	[SEARCH_PARAM_KEYS.YEAR]: () => DEFAULT_QUERY_PARAMS.YEAR,
	[SEARCH_PARAM_KEYS.PTO_DAYS]: () => DEFAULT_QUERY_PARAMS.PTO_DAYS,
	[SEARCH_PARAM_KEYS.ALLOW_PAST_DAYS]: () => DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS,
	[SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS]: async (request: NextRequest) => {
		const premiumUser = await isPremium();

		return premiumUser ? DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS : String(FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE);
	},
};

export async function middleware(request: NextRequest, response: NextResponse): Promise<NextResponse> {
	const url = new URL(response.headers.get("location") ?? request.url);
	const { searchParams } = url;
	let needsRedirect = false;

	for (const [key, getValue] of Object.entries(MIDDLEWARE_PARAMS)) {
		const paramKey = key as keyof typeof MIDDLEWARE_PARAMS;
		if (searchParams.has(paramKey)) {
			const value = searchParams.get(paramKey) ?? "";
			const correctedValue = await validateParam({ key: paramKey, value, request });
			if (correctedValue) {
				searchParams.set(paramKey, correctedValue);
				needsRedirect = true;
			}
		} else {
			const defaultValue = await getValue(request);
			searchParams.set(paramKey, defaultValue);
			needsRedirect = true;
		}
	}

	if (needsRedirect) {
		return NextResponse.redirect(url);
	}

	return response;
}

export const config = {
	matcher: ["/"],
};
