import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { CreatePaymentResult } from '@application/dto/payment/types';
import { createPayment } from '@application/use-cases/payment';
import { describeFailure } from '@infrastructure/api/errors';
import type { ValidationError } from '@infrastructure/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { checkRateLimit } from '@infrastructure/services/payments/rateLimit';
import { Effect } from 'effect';
import { after } from 'next/server';
import { type ApiOutcome, type RequestContext, UNKNOWN_IP } from './types';

export const createPaymentRequest = (
  input: Effect.Effect<CreatePaymentInput, ValidationError>,
  { userAgent, ipAddress }: RequestContext
): Promise<ApiOutcome<CreatePaymentResult>> =>
  Effect.runPromise(
    Effect.gen(function* () {
      yield* checkRateLimit(ipAddress ?? UNKNOWN_IP);

      const body = yield* input;
      const { clientSecret, discountInfo, deferred } = yield* createPayment(body, { userAgent, ipAddress });

      after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));

      return {
        status: 200,
        body: { success: true as const, clientSecret, discountInfo: discountInfo ?? undefined },
      };
    }).pipe(
      Effect.provide(ApplicationLayer),
      Effect.catchAll((failure) => {
        const { status, error } = describeFailure(failure);

        return Effect.succeed({
          status,
          body: {
            success: false as const,
            error,
            ...(failure._tag === 'PromoCodeError' && { isPromoCodeError: true }),
          },
        });
      })
    )
  );
