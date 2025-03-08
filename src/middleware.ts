import { DEFAULT_SEARCH_PARAMS } from "@/const/const";
import { detectLocation } from "@/infrastructure/services/location/detectLocation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REQUIRED_PARAMS = {
	country: async (request: NextRequest) => await detectLocation(request),
	year: () => DEFAULT_SEARCH_PARAMS.YEAR,
	ptoDays: () => DEFAULT_SEARCH_PARAMS.PTO_DAYS,
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const { searchParams } = url;

	const missingParams = Object.keys(REQUIRED_PARAMS).filter((param) => !searchParams.has(param));

	if (missingParams.length === 0) {
		return NextResponse.next();
	}

	const paramsToAdd: Record<string, string> = {};

	for (const param of missingParams) {
		const value = await REQUIRED_PARAMS[param](request);
		if (value && typeof value === "string") {
			paramsToAdd[param] = value;
		}
	}

	missingParams.forEach((param) => {
		if (paramsToAdd[param]) {
			searchParams.set(param, paramsToAdd[param]);
		}
	});

	return NextResponse.redirect(url);
}

export const config = {
	matcher: ["/"],
};
