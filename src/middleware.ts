import type { SearchParams } from '@app/page';
import { MIDDLEWARE_PARAMS } from '@const/const';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';


export async function middleware(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const { searchParams } = url;

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
