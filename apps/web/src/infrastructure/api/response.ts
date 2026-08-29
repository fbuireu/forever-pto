import { NextResponse } from "next/server";

export interface NoStoreParams {
	body: object;
	init?: ResponseInit;
}

export function noStore({ body, init }: NoStoreParams) {
	const response = NextResponse.json(body, init);
	response.headers.set("Cache-Control", "no-store");
	return response;
}
