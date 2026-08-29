import { activateWithClaimedPayment, activateWithEmail } from "@application/use-cases/activatePremium";
import { ApiError } from "@infrastructure/api/errors";
import { activatePremiumRequest } from "@infrastructure/api/operations/activatePremium";
import { resolveClientIp } from "@infrastructure/api/operations/types";
import { parseJsonBody } from "@infrastructure/api/parseJsonBody";
import { noStore } from "@infrastructure/api/response";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { ValidationError } from "@infrastructure/errors";
import { ApplicationLayer } from "@infrastructure/layers";
import { clearPremiumCookie, PREMIUM_COOKIE, setPremiumCookie } from "@infrastructure/services/premium/cookie";
import { verifySession as verifySessionEffect } from "@infrastructure/services/premium/session";
import { isSessionConfigurationError } from "@infrastructure/services/premium/sessionErrors";
import { Effect } from "effect";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
	const cookieStore = await cookies();
	const token = cookieStore.get(PREMIUM_COOKIE)?.value;

	if (!token) return noStore({ body: { premiumKey: null, email: null } });

	const response = await Effect.runPromise(
		verifySessionEffect(token).pipe(
			Effect.map((data) => noStore({ body: { premiumKey: data.paymentIntentId, email: data.email } })),
			Effect.catchTag("SessionError", (failure) =>
				Effect.gen(function* () {
					const res = noStore({ body: { premiumKey: null, email: null } });

					if (isSessionConfigurationError(failure)) {
						const logger = yield* LoggerService;
						logger.logError("Premium session could not be verified, keeping the cookie", failure);

						return res;
					}

					clearPremiumCookie(res);

					return res;
				}),
			),
			Effect.provide(ApplicationLayer),
		),
	);

	return response;
}

export async function POST(request: NextRequest) {
	const outcome = await activatePremiumRequest({
		context: { ipAddress: resolveClientIp(request.headers) },
		program: Effect.gen(function* () {
			const body = yield* parseJsonBody<Record<string, unknown>>(request);
			const email = typeof body.email === "string" ? body.email : undefined;
			const premiumKey = typeof body.premiumKey === "string" ? body.premiumKey : undefined;

			if (!email) return yield* Effect.fail(new ValidationError({ message: ApiError.EMAIL_REQUIRED }));

			return yield* premiumKey
				? activateWithClaimedPayment({ paymentIntentId: premiumKey, expectedEmail: email })
				: activateWithEmail(email);
		}),
	});

	if (outcome.error !== null) return noStore({ body: { error: outcome.error }, init: { status: outcome.status } });

	const response = noStore({ body: { success: true, premiumKey: outcome.premiumKey, email: outcome.email } });
	setPremiumCookie({ response, token: outcome.token });

	return response;
}
