import type { CreatePaymentInput } from "@application/dto/payment/schema";
import { createPaymentRequest } from "@infrastructure/api/operations/payment";
import { resolveClientIp } from "@infrastructure/api/operations/types";
import { parseJsonBody } from "@infrastructure/api/parseJsonBody";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { status, body } = await createPaymentRequest({
		input: parseJsonBody<CreatePaymentInput>(request),
		context: {
			userAgent: request.headers.get("user-agent"),
			ipAddress: resolveClientIp(request.headers),
		},
	});

	return NextResponse.json(body, { status });
}
