import { type CreatePaymentInput, createPaymentSchema } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { PaymentError, type PromoCodeError, ValidationError } from '@infrastructure/errors';
import { createPaymentIntent } from '@infrastructure/services/payments/provider/intent';
import { validatePromoCode } from '@infrastructure/services/payments/provider/promo-code';
import { savePayment } from '@infrastructure/services/payments/repository';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import { Effect } from 'effect';
import Stripe from 'stripe';
import { z } from 'zod';

interface PaymentContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface PaymentResult {
  clientSecret: string;
  discountInfo: DiscountInfo | null;
}

export const createPayment = (
  params: CreatePaymentInput,
  context: PaymentContext
): Effect.Effect<
  PaymentResult,
  ValidationError | PaymentError | PromoCodeError,
  TursoService | StripeServerService | LoggerService
> =>
  Effect.gen(function* () {
    const { userAgent, ipAddress } = context;
    const logger = yield* LoggerService;

    const validated = yield* Effect.try({
      try: () => createPaymentSchema.parse(params),
      catch: (error) => {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          logger.warn('Payment validation error', {
            field: firstError?.path.join('.'),
            message: firstError?.message,
            code: firstError?.code,
          });
          return new ValidationError({ message: firstError?.message ?? 'Validation failed' });
        }
        logger.logError('Unknown payment creation error', error, {
          amount: params.amount,
          hasPromoCode: !!params.promoCode,
          userAgent,
          ipAddress,
        });
        return new ValidationError({ message: error instanceof Error ? error.message : String(error) });
      },
    });

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

    yield* savePayment({
      id: paymentIntent.id,
      stripeCreatedAt: new Date(paymentIntent.created * 1000),
      customerId: extractCustomerId(paymentIntent.customer),
      chargeId: extractChargeId(paymentIntent.latest_charge),
      email: validated.email,
      amount: Math.round(finalAmount * 100),
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethodType: paymentIntent.payment_method_types?.[0] ?? null,
      description: paymentIntent.description ?? null,
      promoCode: validated.promoCode ?? null,
      userAgent,
      ipAddress,
      country: null,
      customerName: null,
      postalCode: null,
      city: null,
      state: null,
      paymentBrand: null,
      paymentLast4: null,
      feeAmount: null,
      netAmount: null,
      refundedAt: null,
      refundReason: null,
      disputedAt: null,
      disputeReason: null,
      parentPaymentId: null,
      origin: null,
    }).pipe(
      Effect.catchAll((e) =>
        Effect.sync(() => {
          logger.warn('Failed to save payment to database, will use webhook fallback', {
            reason: e.message,
            paymentIntentId: paymentIntent.id,
            emailDomain: validated.email?.split('@')[1],
          });
        })
      )
    );

    if (!paymentIntent.client_secret) {
      return yield* Effect.fail(new PaymentError({ message: 'PaymentIntent missing client_secret' }));
    }

    return { clientSecret: paymentIntent.client_secret, discountInfo };
  });
