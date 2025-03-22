import { DEFAULT_SEARCH_PARAMS, FILTER_MAXIMUM_VALUES, PREMIUM_COOKIE, SEARCH_PARAM_KEYS } from '@const/const';
import type { RequiredParamsMap } from '@const/types';
import { getDefaultValue } from '@infrastructure/middleware/utils/getDefaultValue/getDefaultValue';
import { validateParam } from '@infrastructure/middleware/utils/validateParam/validateParam';
import { detectLocation } from '@infrastructure/services/location/detectLocation';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const MIDDLEWARE_PARAMS: RequiredParamsMap = {
	[SEARCH_PARAM_KEYS.COUNTRY]: async (request: NextRequest) => await detectLocation(request),
	[SEARCH_PARAM_KEYS.YEAR]: () => DEFAULT_SEARCH_PARAMS.YEAR,
	[SEARCH_PARAM_KEYS.PTO_DAYS]: () => DEFAULT_SEARCH_PARAMS.PTO_DAYS,
	[SEARCH_PARAM_KEYS.ALLOW_PAST_DAYS]: () => DEFAULT_SEARCH_PARAMS.ALLOW_PAST_DAYS,
	[SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS]: async (request: NextRequest) => {
		const isPremium = request.cookies.get(PREMIUM_COOKIE.NAME)?.value === "true";

		if (!isPremium) {
			return String(FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE);
		}

		return DEFAULT_SEARCH_PARAMS.CARRY_OVER_MONTHS;
	},
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const { searchParams } = url;
	let needsRedirect = false;
	const requiredParamKeys = Object.keys(MIDDLEWARE_PARAMS) as Array<keyof typeof MIDDLEWARE_PARAMS>;

	for (const paramKey of requiredParamKeys) {
		if (searchParams.has(paramKey)) {
			const currentValue = searchParams.get(paramKey) || "";
			const correctedValue = await validateParam({ key: paramKey, value: currentValue, request });

			if (correctedValue) {
				searchParams.set(paramKey, correctedValue);
				needsRedirect = true;
			}
		} else {
			const defaultValue = await getDefaultValue({ key: paramKey, request });

			if (defaultValue) {
				searchParams.set(paramKey, defaultValue);
				needsRedirect = true;
			}
		}
	}

	if (needsRedirect) {
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/"],
};
