import { paymentDataDTO } from '@application/dto/payment/dto';
import { type CreatePaymentInput, createPaymentSchema } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { zodParse } from '@application/shared/utils/zodParse';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PaymentError, type PromoCodeError, type ValidationError } from '@infrastructure/errors';
import { createPaymentIntent } from '@infrastructure/services/payments/provider/intent';
import { validatePromoCode } from '@infrastructure/services/payments/provider/promoCode';
import { savePayment } from '@infrastructure/services/payments/repository';
import { Effect } from 'effect';
import Stripe from 'stripe';

interface PaymentContext {
  userAgent: string | null;
  ipAddress: string | null;
}

interface PaymentResult {
  clientSecret: string;
  discountInfo: DiscountInfo | null;
  deferred: Effect.Effect<void, never, TursoService>;
}

export const createPayment = (
  params: CreatePaymentInput,
  context: PaymentContext
): Effect.Effect<PaymentResult, ValidationError | PaymentError | PromoCodeError, StripeServerService | LoggerService> =>
  Effect.gen(function* () {
    const { userAgent, ipAddress } = context;
    const logger = yield* LoggerService;

    const validated = yield* zodParse(createPaymentSchema, params);

    let finalAmount = validated.amount;
    let discountInfo: DiscountInfo | null = null;

    if (validated.promoCode?.trim()) {
      discountInfo = yield* validatePromoCode(validated.promoCode, validated.amount);
      finalAmount = discountInfo.finalAmount;
    }

    const paymentIntent = yield* createPaymentIntent({
      amount: finalAmount,
      email: validated.email,
      promoCode: validated.promoCode,
      discountInfo,
      userAgent,
      ipAddress,
    }).pipe(
      Effect.tapError((e) =>
        Effect.sync(() => {
          if (e.cause instanceof Stripe.errors.StripeError) {
            logger.logError('Stripe payment creation error', e.cause, {
              stripeErrorType: e.cause.type,
              stripeErrorCode: e.cause.code,
              amount: params.amount,
              hasPromoCode: !!params.promoCode,
              userAgent,
              ipAddress,
            });
          } else {
            logger.logError('Unknown payment creation error', e.cause ?? e, {
              amount: params.amount,
              hasPromoCode: !!params.promoCode,
              userAgent,
              ipAddress,
            });
          }
        })
      )
    );

    if (!paymentIntent.client_secret) {
      return yield* Effect.fail(new PaymentError({ message: 'PaymentIntent missing client_secret' }));
    }

    const deferred = Effect.suspend(() =>
      savePayment(
        paymentDataDTO.create({
          raw: paymentIntent,
          params: {
            email: validated.email,
            promoCode: validated.promoCode ?? null,
            userAgent,
            ipAddress,
          },
        })
      ).pipe(
        Effect.catchAll((e) =>
          Effect.sync(() => {
            logger.warn('Failed to save payment to database, will use webhook fallback', {
              reason: e.message,
              paymentIntentId: paymentIntent.id,
              emailDomain: validated.email?.split('@')[1],
            });
          })
        )
      )
    );

    return { clientSecret: paymentIntent.client_secret, discountInfo, deferred };
  });
