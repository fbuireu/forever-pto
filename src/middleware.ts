import { FILTER_MAXIMUM_VALUES, MIDDLEWARE_PARAMS, PREMIUM_COOKIE, SEARCH_PARAM_KEYS } from '@const/const';
import type { SearchParams } from '@const/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const { searchParams } = url;

	if (searchParams.has(SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS)) {
		const isPremium = request.cookies.get(PREMIUM_COOKIE.NAME)?.value === "true";
		const maxValue = isPremium
			? FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.PREMIUM
			: FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE;
		const value = Number.parseInt(searchParams.get(SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS) || "1", 10);

		if (Number.isNaN(value) || value < 1 || value > maxValue) {
			const newValue = Number.isNaN(value) ? 1 : Math.min(Math.max(1, value), maxValue);
			searchParams.set(SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS, String(newValue));
			return NextResponse.redirect(url);
		}
	}

	const requiredParamKeys = Object.keys(MIDDLEWARE_PARAMS) as Array<keyof SearchParams>;
	const missingParams = requiredParamKeys.filter((param) => !searchParams.has(param));

	if (missingParams.length === 0) {
		return NextResponse.next();
	}

	const paramsToAdd: Record<string, string> = {};

	for (const missingParam of missingParams) {
		const defaultValueFn = MIDDLEWARE_PARAMS[missingParam];

		if (defaultValueFn) {
			paramsToAdd[missingParam] = await defaultValueFn(request);
			searchParams.set(missingParam, paramsToAdd[missingParam]);
		}
	}

	return NextResponse.redirect(url);
}

export const config = {
	matcher: ["/"],
};
