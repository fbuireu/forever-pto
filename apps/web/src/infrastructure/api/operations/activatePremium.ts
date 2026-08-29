import { describeFailure } from "@infrastructure/api/errors";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import type { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import type {
	DatabaseError,
	PaymentError,
	RateLimitError,
	SessionError,
	ValidationError,
} from "@infrastructure/errors";
import { ApplicationLayer } from "@infrastructure/layers";
import { checkRateLimit } from "@infrastructure/services/payments/rateLimit";
import { Effect } from "effect";
import { after } from "next/server";
import { type RequestContext, UNKNOWN_IP } from "./types";

interface ActivationResult {
	email: string;
	premiumKey: string;
	token: string;
	deferred: Effect.Effect<void, never, TursoService>;
}

type ActivationFailure = RateLimitError | ValidationError | SessionError | PaymentError | DatabaseError;

export type ActivationOutcome =
	| { status: 200; token: string; email: string; premiumKey: string; error: null }
	| { status: 400 | 429 | 500; token: null; email: null; premiumKey: null; error: string };

const failureContext = (failure: ActivationFailure): Record<string, unknown> => {
	const { _tag, ...fields } = failure as unknown as Record<string, unknown>;

	return { tag: failure._tag, ...fields, ...(failure.message ? { reason: failure.message } : {}) };
};

interface RefusedParams {
	status: 400 | 429 | 500;
	error: string;
}

const refused = ({ status, error }: RefusedParams): ActivationOutcome => ({
	status,
	token: null,
	email: null,
	premiumKey: null,
	error,
});

export interface ActivatePremiumRequestParams {
	context: Pick<RequestContext, "ipAddress">;
	program: Effect.Effect<ActivationResult, ActivationFailure, StripeServerService | LoggerService | TursoService>;
}

export const activatePremiumRequest = ({
	context: { ipAddress },
	program,
}: ActivatePremiumRequestParams): Promise<ActivationOutcome> =>
	Effect.runPromise(
		checkRateLimit(ipAddress ?? UNKNOWN_IP).pipe(
			Effect.andThen(() => program),
			Effect.map(({ email, premiumKey, token, deferred }): ActivationOutcome => {
				after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));
				return { status: 200, token, email, premiumKey, error: null };
			}),
			Effect.catchAll((failure) =>
				Effect.gen(function* () {
					const logger = yield* LoggerService;
					const { status, error } = describeFailure(failure);

					if (status >= 500) {
						logger.error("Premium activation failed", failureContext(failure));
					} else {
						logger.warn("Premium activation refused", failureContext(failure));
					}

					return refused({ status: status as 400 | 429 | 500, error });
				}),
			),
			Effect.provide(ApplicationLayer),
		),
	);
