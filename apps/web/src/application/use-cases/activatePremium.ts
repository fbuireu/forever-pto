import { paymentDataDTO } from '@application/dto/payment/dto';
import type { NewPayment } from '@application/dto/payment/types';
import { emailDomain } from '@application/shared/utils/redact';
import { PAYMENT_SUCCEEDED } from '@domain/payment/events/types';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { type DatabaseError, type PaymentError, type SessionError, ValidationError } from '@infrastructure/errors';
import { normalizeEmail } from '@infrastructure/services/payments/normalizeEmail';
import { readDonationMetadata } from '@infrastructure/services/payments/provider/metadata';
import {
  getSucceededPaymentByEmail,
  savePayment,
  updatePaymentStatus,
} from '@infrastructure/services/payments/repository';
import { matchesClientSecret } from '@infrastructure/services/premium/activation';
import { createSession } from '@infrastructure/services/premium/session';
import { Effect } from 'effect';

interface ActivateWithPaymentParams {
  paymentIntentId: string;
  expectedEmail?: string;
  clientSecret?: string;
}

export const activateWithPayment = ({
  paymentIntentId,
  expectedEmail,
  clientSecret,
}: ActivateWithPaymentParams): Effect.Effect<
  { email: string; premiumKey: string; token: string; deferred: Effect.Effect<void, never, TursoService> },
  ValidationError | SessionError | PaymentError,
  StripeServerService | LoggerService
> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;
    const stripe = yield* StripeServerService;

    const paymentIntent = yield* stripe.paymentIntents.retrieve(paymentIntentId);

    if (clientSecret && !matchesClientSecret(paymentIntent.client_secret, clientSecret)) {
      return yield* Effect.fail(new ValidationError({ message: 'Client secret mismatch' }));
    }

    if (paymentIntent.status !== 'succeeded') {
      return yield* Effect.fail(new ValidationError({ message: 'Payment not completed' }));
    }

    const { email: intentEmail, promoCode, userAgent, ipAddress } = readDonationMetadata(paymentIntent);
    const email = intentEmail ? normalizeEmail(intentEmail) : undefined;
    if (!email || (expectedEmail && normalizeEmail(expectedEmail) !== email)) {
      return yield* Effect.fail(new ValidationError({ message: 'Email mismatch' }));
    }

    const deferred = Effect.gen(function* () {
      const paymentData: NewPayment = paymentDataDTO.create({
        raw: paymentIntent,
        params: { email, promoCode, userAgent, ipAddress },
      });

      yield* savePayment(paymentData).pipe(
        Effect.tap((created) =>
          Effect.sync(() => {
            if (created) logger.info('Payment created successfully', { paymentIntentId });
          })
        ),
        Effect.tapError((e) =>
          Effect.sync(() => {
            logger.warn('Failed to save payment to database, will use webhook fallback', {
              reason: e.message,
              paymentIntentId,
              emailDomain: emailDomain(email),
            });
          })
        ),
        Effect.catchAll(() => Effect.succeed(false))
      );

      yield* updatePaymentStatus(paymentIntentId, PAYMENT_SUCCEEDED).pipe(
        Effect.catchAll((e) =>
          Effect.sync(() => {
            logger.error('Failed to update payment status', {
              reason: e.message,
              paymentIntentId,
              emailDomain: emailDomain(email),
            });
            return false;
          })
        )
      );
    });

    const token = yield* createSession({ email, paymentIntentId });

    return { email, premiumKey: paymentIntentId, token, deferred };
  });

export const activateWithEmail = (
  email: string
): Effect.Effect<
  { email: string; premiumKey: string; token: string; deferred: Effect.Effect<void, never, TursoService> },
  ValidationError | SessionError | DatabaseError,
  TursoService
> =>
  Effect.gen(function* () {
    const normalizedEmail = normalizeEmail(email);
    const payment = yield* getSucceededPaymentByEmail(normalizedEmail);

    if (!payment) {
      return yield* Effect.fail(new ValidationError({ message: 'No payment found' }));
    }

    const token = yield* createSession({ email: normalizedEmail, paymentIntentId: payment.id });

    return { email: normalizedEmail, premiumKey: payment.id, token, deferred: Effect.void };
  });
