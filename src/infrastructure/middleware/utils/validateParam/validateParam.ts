import { DEFAULT_SEARCH_PARAMS, FILTER_MAXIMUM_VALUES, PREMIUM_COOKIE, SEARCH_PARAM_KEYS } from '@const/const';
import { detectLocation } from '@infrastructure/services/location/detectLocation/detectLocation';
import type { NextRequest } from 'next/server';
import type { MIDDLEWARE_PARAMS } from '@infrastructure/middleware/middleware';

type ValidatorFunction = (value: string, request: NextRequest) => Promise<string | null> | string | null;

const PARAM_VALIDATORS: Record<string, ValidatorFunction> = {
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

interface ValidateParamParams {
	key: keyof typeof MIDDLEWARE_PARAMS;
	value: string;
	request: NextRequest;
}

export async function validateParam({ key, value, request }: ValidateParamParams): Promise<string | null> {
	const validator = PARAM_VALIDATORS[key];
	if (!validator) return null;

	return validator(value, request);
}
