import type { SearchParams } from '@const/types';

interface CreateQueryStringParams {
	value: string;
	type?: keyof SearchParams;
	searchParams: URLSearchParams;
}

export function createQueryString({ value, type, searchParams }: CreateQueryStringParams): string {
	const params = new URLSearchParams(searchParams);

	if (!type) return params.toString();

	switch (type) {
		case "country":
			params.set(type, value);
			params.delete("region");
			break;
		default:
			params.set(type, value);
	}

	return params.toString();
}
