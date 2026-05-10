import type { PaymentData } from '@application/dto/payment/types';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { type DatabaseError, type SessionError, ValidationError } from '@infrastructure/errors';
import {
  getPaymentByEmail,
  getPaymentById,
  savePayment,
  updatePaymentStatus,
} from '@infrastructure/services/payments/repository';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import { createSession } from '@infrastructure/services/premium/session';
import { Effect } from 'effect';
import type Stripe from 'stripe';

const buildPaymentDataFromIntent = (paymentIntent: Stripe.PaymentIntent, email: string): PaymentData => ({
  id: paymentIntent.id,
  stripeCreatedAt: new Date(paymentIntent.created * 1000),
  customerId: extractCustomerId(paymentIntent.customer),
  chargeId: extractChargeId(paymentIntent.latest_charge),
  email,
  amount: paymentIntent.amount,
  currency: paymentIntent.currency,
  status: paymentIntent.status,
  paymentMethodType: paymentIntent.payment_method_types?.[0] ?? null,
  description: paymentIntent.description ?? null,
  promoCode: paymentIntent.metadata.promoCode ?? null,
  userAgent: paymentIntent.metadata.userAgent ?? null,
  ipAddress: paymentIntent.metadata.ipAddress ?? null,
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
});

export const activateWithPayment = (
  email: string,
  paymentIntentId: string
): Effect.Effect<
  { email: string; premiumKey: string; token: string },
  ValidationError | SessionError | DatabaseError,
  TursoService | StripeServerService | LoggerService
> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;
    const stripe = yield* StripeServerService;

    const paymentIntent = yield* stripe.paymentIntents
      .retrieve(paymentIntentId)
      .pipe(Effect.mapError((e) => new ValidationError({ message: e.message })));

    if (paymentIntent.status !== 'succeeded') {
      return yield* Effect.fail(new ValidationError({ message: 'Payment not completed' }));
    }

    const paymentEmail = paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? undefined;
    if (paymentEmail && paymentEmail !== email) {
      return yield* Effect.fail(new ValidationError({ message: 'Email mismatch' }));
    }

    const existingPayment = yield* getPaymentById(paymentIntentId).pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    if (existingPayment) {
      if (existingPayment.status !== 'succeeded') {
        yield* updatePaymentStatus(paymentIntentId, 'succeeded').pipe(
          Effect.catchAll((e) =>
            Effect.sync(() => {
              logger.error('Failed to update payment status', {
                reason: e.message,
                paymentIntentId,
                emailDomain: email?.split('@')[1],
              });
            })
          )
        );
      }
    } else {
      yield* savePayment(buildPaymentDataFromIntent(paymentIntent, email)).pipe(
        Effect.tap(() => Effect.sync(() => logger.info('Payment created successfully', { paymentIntentId }))),
        Effect.tapError((e) =>
          Effect.sync(() => {
            logger.error('Failed to save payment to DB', {
              reason: e.message,
              paymentIntentId,
              emailDomain: email?.split('@')[1],
            });
          })
        ),
        Effect.catchAll(() => Effect.void)
      );
    }

    const token = yield* createSession({ email, paymentIntentId });

    return { email, premiumKey: paymentIntentId, token };
  });

export const activateWithEmail = (
  email: string
): Effect.Effect<
  { email: string; premiumKey: string; token: string },
  ValidationError | SessionError | DatabaseError,
  TursoService | LoggerService
> =>
  Effect.gen(function* () {
    const payment = yield* getPaymentByEmail(email);

    if (!payment) {
      return yield* Effect.fail(new ValidationError({ message: 'No payment found' }));
    }

    if (payment.status !== 'succeeded') {
      return yield* Effect.fail(new ValidationError({ message: `Payment status is ${payment.status}` }));
    }

    const token = yield* createSession({ email, paymentIntentId: payment.id });

    return { email, premiumKey: payment.id, token };
  });
