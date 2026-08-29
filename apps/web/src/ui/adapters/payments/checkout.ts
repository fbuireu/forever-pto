import type { CreatePaymentInput } from "@application/dto/payment/schema";
import type { DiscountInfo } from "@application/dto/payment/types";
import { logClient } from "@application/shared/utils/clientLog";
import { emailDomain } from "@application/shared/utils/redact";
import { createPaymentAction } from "@infrastructure/actions/payment";
import { PaymentError, PromoCodeError, type PromoCodeErrorCode } from "@infrastructure/errors";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { Effect } from "effect";

interface InitializePaymentResult {
	clientSecret: string;
	discountInfo: DiscountInfo | null;
}

export const initializePayment = async (params: CreatePaymentInput): Promise<InitializePaymentResult> => {
	const result = await createPaymentAction(params);

	if (!result.success) {
		if (result.isPromoCodeError && result.error) {
			throw new PromoCodeError({ code: result.error as PromoCodeErrorCode });
		}
		throw new PaymentError({ message: result.error ?? "Payment initialization failed" });
	}

	return {
		clientSecret: result.clientSecret,
		discountInfo: result.discountInfo ?? null,
	};
};

interface ConfirmPaymentParams {
	stripe: Stripe;
	elements: StripeElements;
	email: string;
	returnUrl: string;
}

export const ConfirmPaymentOutcome = {
	SUCCEEDED: "succeeded",
	REFUSED_BEFORE_CHARGE: "refused_before_charge",
	FAILED_AFTER_CHARGE: "failed_after_charge",
	HANDED_OFF_TO_ISSUER: "handed_off_to_issuer",
} as const;

export type ConfirmPaymentOutcome = (typeof ConfirmPaymentOutcome)[keyof typeof ConfirmPaymentOutcome];

export type ConfirmPaymentResult =
	| { outcome: typeof ConfirmPaymentOutcome.SUCCEEDED; sessionData: { premiumKey: string; email: string } }
	| { outcome: typeof ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE; error: string }
	| { outcome: typeof ConfirmPaymentOutcome.FAILED_AFTER_CHARGE; error: string }
	| { outcome: typeof ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER };

export const confirmPayment = async (params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> => {
	const { stripe, elements, email, returnUrl } = params;
	let charged = false;

	const program = Effect.gen(function* () {
		const { error: submitError } = yield* Effect.tryPromise(() => elements.submit());
		if (submitError) return { outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: submitError.message ?? "" };

		const { error, paymentIntent } = yield* Effect.tryPromise(() =>
			stripe.confirmPayment({
				elements,
				confirmParams: { return_url: returnUrl, receipt_email: email },
				redirect: "if_required",
			}),
		);

		if (error) return { outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: error.message ?? "" };

		if (!paymentIntent) {
			logClient((logger) =>
				logger.warn("Payment confirmation resolved without a payment intent", {
					emailDomain: emailDomain(email),
					returnUrl,
				}),
			);
			return { outcome: ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER };
		}

		charged = true;

		const sessionResponse = yield* Effect.tryPromise(() =>
			fetch("/api/check-session", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, premiumKey: paymentIntent.id }),
			}),
		);

		if (!sessionResponse.ok) {
			const errorData = yield* Effect.tryPromise(() => sessionResponse.json() as Promise<{ error?: string }>);
			logClient((logger) =>
				logger.error("Session activation failed after payment", {
					statusCode: sessionResponse.status,
					reason: errorData.error,
					emailDomain: emailDomain(email),
					paymentIntentId: paymentIntent.id,
				}),
			);
			return { outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: errorData.error ?? "" };
		}

		const sessionData = yield* Effect.tryPromise(
			() => sessionResponse.json() as Promise<{ premiumKey: string; email: string }>,
		);

		return {
			outcome: ConfirmPaymentOutcome.SUCCEEDED,
			sessionData: { premiumKey: sessionData.premiumKey, email: sessionData.email },
		};
	}).pipe(
		Effect.catchAll((error) => {
			logClient((logger) =>
				logger.logError("Payment confirmation error in checkout adapter", error, {
					emailDomain: emailDomain(email),
					returnUrl,
				}),
			);

			const message = error instanceof Error ? error.message : "";

			return Effect.succeed<ConfirmPaymentResult>(
				charged
					? { outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: message }
					: { outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: message },
			);
		}),
	);

	return Effect.runPromise(program);
};
