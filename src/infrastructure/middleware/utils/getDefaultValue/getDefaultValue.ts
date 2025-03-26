import { MIDDLEWARE_PARAMS } from "@infrastructure/middleware/middleware";
import type { NextRequest } from "next/server";

interface GetDefaultValueParams {
	key: keyof typeof MIDDLEWARE_PARAMS;
	request: NextRequest;
}

export async function getDefaultValue({ key, request }: GetDefaultValueParams): Promise<string | null> {
	const defaultValueFn = MIDDLEWARE_PARAMS[key];

	return defaultValueFn ? await defaultValueFn(request) : null;
}
