import { PaymentError, WebhookError } from '@infrastructure/errors';
import { Context, Effect, Layer } from 'effect';
import StripeNode from 'stripe';

export class StripeServerService extends Context.Tag('StripeServerService')<
  StripeServerService,
  {
    paymentIntents: {
      create(params: StripeNode.PaymentIntentCreateParams): Effect.Effect<StripeNode.PaymentIntent, PaymentError>;
      retrieve(id: string): Effect.Effect<StripeNode.PaymentIntent, PaymentError>;
    };
    charges: {
      retrieve(id: string): Effect.Effect<StripeNode.Charge, PaymentError>;
    };
    promotionCodes: {
      list(
        params: StripeNode.PromotionCodeListParams
      ): Effect.Effect<StripeNode.ApiList<StripeNode.PromotionCode>, PaymentError>;
      retrieve(
        id: string,
        params?: StripeNode.PromotionCodeRetrieveParams
      ): Effect.Effect<StripeNode.PromotionCode, PaymentError>;
    };
    webhooks: {
      constructEvent(payload: string, signature: string): Effect.Effect<StripeNode.Event, WebhookError>;
    };
  }
>() {}

export const StripeServerServiceLive = Layer.sync(StripeServerService, () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY environment variable is not set');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = new StripeNode(secretKey, {
    apiVersion: '2026-04-22.dahlia',
    httpClient: StripeNode.createFetchHttpClient(),
  });

  const wrapError = (error: unknown): PaymentError =>
    new PaymentError({
      message: error instanceof Error ? error.message : String(error),
      cause: error,
    });

  return {
    paymentIntents: {
      create: (params) => Effect.tryPromise({ try: () => stripe.paymentIntents.create(params), catch: wrapError }),
      retrieve: (id) => Effect.tryPromise({ try: () => stripe.paymentIntents.retrieve(id), catch: wrapError }),
    },
    charges: {
      retrieve: (id) => Effect.tryPromise({ try: () => stripe.charges.retrieve(id), catch: wrapError }),
    },
    promotionCodes: {
      list: (params) => Effect.tryPromise({ try: () => stripe.promotionCodes.list(params), catch: wrapError }),
      retrieve: (id, params) =>
        Effect.tryPromise({ try: () => stripe.promotionCodes.retrieve(id, params ?? {}), catch: wrapError }),
    },
    webhooks: {
      constructEvent: (payload, signature) =>
        Effect.try({
          try: () => {
            if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
            return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
          },
          catch: (error) =>
            new WebhookError({
              message: error instanceof Error ? error.message : String(error),
              isSignatureError: error instanceof StripeNode.errors.StripeSignatureVerificationError,
              cause: error,
            }),
        }),
    },
  };
});
