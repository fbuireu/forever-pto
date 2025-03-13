import type { SearchParams } from '@app/page';
import { DEFAULT_SEARCH_PARAMS } from '@const/const';
import { detectLocation } from '@infrastructure/services/location/detectLocation';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type RequiredParamsMap = {
	[K in keyof SearchParams]?: (request: NextRequest) => string | Promise<string>;
};

const REQUIRED_PARAMS: RequiredParamsMap = {
	country: async (request: NextRequest) => await detectLocation(request),
	year: () => DEFAULT_SEARCH_PARAMS.YEAR,
	ptoDays: () => DEFAULT_SEARCH_PARAMS.PTO_DAYS,
	allowPastDays: () => DEFAULT_SEARCH_PARAMS.ALLOW_PAST_DAYS,
	monthsToShow: () => DEFAULT_SEARCH_PARAMS.MONTHS_TO_SHOW,
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const { searchParams } = url;

	const requiredParamKeys = Object.keys(REQUIRED_PARAMS) as Array<keyof SearchParams>;

	const missingParams = requiredParamKeys.filter((param) => !searchParams.has(param as string));

	if (missingParams.length === 0) {
		return NextResponse.next();
	}

	const paramsToAdd: Record<string, string> = {};

	for (const missingParam of missingParams) {
		const defaultValueFn = REQUIRED_PARAMS[missingParam];

		if (defaultValueFn) {
			paramsToAdd[missingParam] = await defaultValueFn(request);
		}
	}

	for (const missingParam of missingParams) {
		if (paramsToAdd[missingParam]) {
			searchParams.set(missingParam, paramsToAdd[missingParam]);
		}
	}

	return NextResponse.redirect(url);
}

export const config = {
	matcher: ["/"],
};
