import type { NextRequest } from 'next/server';
import { type MIDDLEWARE_PARAMS, PARAM_VALIDATORS } from '../../../middleware';

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
