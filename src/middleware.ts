import { DEFAULT_SEARCH_PARAMS, FILTER_MAXIMUM_VALUES, PREMIUM_COOKIE, SEARCH_PARAM_KEYS } from '@const/const';
import type { RequiredParamsMap, ValidatorFunction } from '@const/types';
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

export const PARAM_VALIDATORS: Record<string, ValidatorFunction> = {
	[SEARCH_PARAM_KEYS.COUNTRY]: async (value, request) => {
		if (value.length !== 2 || Number(value)) {
			return await detectLocation(request);
		}
		return null;
	},
	[SEARCH_PARAM_KEYS.REGION]: (_) => null,
	[SEARCH_PARAM_KEYS.YEAR]: (value) => {
		const year = Number.parseInt(value, 10);
		const currentYear = new Date().getFullYear();
		const allowedYears = FILTER_MAXIMUM_VALUES.YEARS(String(currentYear));

		if (Number.isNaN(year) || !allowedYears.includes(year)) {
			return DEFAULT_SEARCH_PARAMS.YEAR;
		}
		return null;
	},
	[SEARCH_PARAM_KEYS.PTO_DAYS]: (value) => {
		const days = Number.parseInt(value, 10);

		if (Number.isNaN(days) || days < 0 || days > 365) {
			return DEFAULT_SEARCH_PARAMS.PTO_DAYS;
		}
		return null;
	},
	[SEARCH_PARAM_KEYS.ALLOW_PAST_DAYS]: (value) => {
		if (value !== "true" && value !== "false") {
			return DEFAULT_SEARCH_PARAMS.ALLOW_PAST_DAYS;
		}
		return null;
	},
	[SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS]: async (value, request) => {
		const isPremium = request.cookies.get(PREMIUM_COOKIE.NAME)?.value === "true";
		const maxValue = isPremium
			? FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.PREMIUM
			: FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE;

		const months = Number.parseInt(value, 10);

		if (Number.isNaN(months) || months < 1 || months > maxValue) {
			const newValue = Number.isNaN(months) ? 1 : Math.min(Math.max(1, months), maxValue);
			return String(newValue);
		}
		return null;
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
			const validator = PARAM_VALIDATORS[paramKey];

			if (validator) {
				const correctedValue = await validator(currentValue, request);

				if (correctedValue) {
					searchParams.set(paramKey, correctedValue);
					needsRedirect = true;
				}
			}
		} else {
			const defaultValueFn = MIDDLEWARE_PARAMS[paramKey];
			if (defaultValueFn) {
				const defaultValue = await defaultValueFn(request);
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
