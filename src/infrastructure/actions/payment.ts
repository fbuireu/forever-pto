"use server";

import type { CreatePaymentInput } from "@application/dto/payment/schema";
import type { CreatePaymentResult } from "@application/dto/payment/types";
import { createPaymentRequest } from "@infrastructure/api/operations/payment";
import { resolveClientIp } from "@infrastructure/api/operations/types";
import { Effect } from "effect";
import { headers } from "next/headers";

export async function createPaymentAction(params: CreatePaymentInput): Promise<CreatePaymentResult> {
	const headersList = await headers();

	const { body } = await createPaymentRequest(Effect.succeed(params), {
		userAgent: headersList.get("user-agent"),
		ipAddress: resolveClientIp(headersList),
	});

	return body;
}
