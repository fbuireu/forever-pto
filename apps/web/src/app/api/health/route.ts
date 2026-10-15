import { noStore } from "@infrastructure/api/response";
import type { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<object>> {
	return noStore({
		body: {
			status: "ok",
			timestamp: new Date().toISOString(),
		},
	});
}
