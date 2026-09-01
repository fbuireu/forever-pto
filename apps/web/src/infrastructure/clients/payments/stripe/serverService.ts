import { PaymentError, PaymentRequestError, WebhookError } from "@infrastructure/errors";
import { Context, Effect, Layer } from "effect";
import StripeNode from "stripe";

class MissingStripeConfiguration extends Error {}

export class WebhookConfigurationError extends WebhookError {}

export const isWebhookConfigurationError = (error: WebhookError): error is WebhookConfigurationError =>
	error instanceof WebhookConfigurationError;

export class StripeServerService extends Context.Tag("StripeServerService")<
	StripeServerService,
	{
		paymentIntents: {
			create(params: StripeNode.PaymentIntentCreateParams): Effect.Effect<StripeNode.PaymentIntent, PaymentError>;
			retrieve(id: string): Effect.Effect<StripeNode.PaymentIntent, PaymentError>;
		};
		charges: {
			retrieve(id: string, params?: StripeNode.ChargeRetrieveParams): Effect.Effect<StripeNode.Charge, PaymentError>;
		};
		promotionCodes: {
			list(
				params: StripeNode.PromotionCodeListParams,
			): Effect.Effect<StripeNode.ApiList<StripeNode.PromotionCode>, PaymentError>;
		};
		webhooks: {
			constructEvent(payload: string, signature: string): Effect.Effect<StripeNode.Event, WebhookError>;
		};
	}
>() {}

export const StripeServerServiceLive = Layer.sync(StripeServerService, () => {
	let stripe: StripeNode | null = null;

	const getStripe = () => {
		if (!stripe) {
			const secretKey = process.env.STRIPE_SECRET_KEY;
			if (!secretKey) throw new MissingStripeConfiguration("STRIPE_SECRET_KEY environment variable is not set");

			stripe = new StripeNode(secretKey, {
				apiVersion: "2026-07-29.dahlia",
				httpClient: StripeNode.createFetchHttpClient(),
			});
		}

		return stripe;
	};

	const wrapError = (error: unknown): PaymentError => {
		const message = error instanceof Error ? error.message : String(error);

		if (error instanceof StripeNode.errors.StripeInvalidRequestError) {
			return new PaymentRequestError({ message, cause: error });
		}

		return new PaymentError({ message, cause: error });
	};

	const wrapWebhookError = (error: unknown): WebhookError => {
		const message = error instanceof Error ? error.message : String(error);

		if (error instanceof MissingStripeConfiguration) {
			return new WebhookConfigurationError({ message, isSignatureError: false, cause: error });
		}

		return new WebhookError({
			message,
			isSignatureError: error instanceof StripeNode.errors.StripeSignatureVerificationError,
			cause: error,
		});
	};

	return {
		paymentIntents: {
			create: (params) => Effect.tryPromise({ try: () => getStripe().paymentIntents.create(params), catch: wrapError }),
			retrieve: (id) => Effect.tryPromise({ try: () => getStripe().paymentIntents.retrieve(id), catch: wrapError }),
		},
		charges: {
			retrieve: (id, params) =>
				Effect.tryPromise({ try: () => getStripe().charges.retrieve(id, params ?? {}), catch: wrapError }),
		},
		promotionCodes: {
			list: (params) => Effect.tryPromise({ try: () => getStripe().promotionCodes.list(params), catch: wrapError }),
		},
		webhooks: {
			constructEvent: (payload, signature) =>
				Effect.try({
					try: () => {
						const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
						if (!webhookSecret) throw new MissingStripeConfiguration("STRIPE_WEBHOOK_SECRET is not defined");
						return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
					},
					catch: wrapWebhookError,
				}),
		},
	};
});
