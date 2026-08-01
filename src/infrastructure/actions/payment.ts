'use server';

import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { CreatePaymentResult } from '@application/dto/payment/types';
import { createPayment } from '@application/use-cases/payment';
import { ApiError } from '@infrastructure/api/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { checkRateLimit } from '@infrastructure/services/payments/rateLimit';
import { Effect } from 'effect';
import { headers } from 'next/headers';
import { after } from 'next/server';

export async function createPaymentAction(params: CreatePaymentInput): Promise<CreatePaymentResult> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const ipAddress =
    headersList.get('cf-connecting-ip') ?? headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip');

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* checkRateLimit(ipAddress ?? 'unknown');

      const { clientSecret, discountInfo, deferred } = yield* createPayment(params, { userAgent, ipAddress });

      after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));

      return {
        success: true as const,
        clientSecret,
        discountInfo: discountInfo ?? undefined,
      };
    }).pipe(
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        RateLimitError: () => Effect.succeed({ success: false as const, error: ApiError.RATE_LIMIT_EXCEEDED }),
        ValidationError: (e) => Effect.succeed({ success: false as const, error: e.message }),
        PromoCodeError: (e) =>
          Effect.succeed({ success: false as const, error: e.code, isPromoCodeError: true as const }),
        PaymentError: () => Effect.succeed({ success: false as const, error: ApiError.INTERNAL_ERROR }),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false as const, error: ApiError.INTERNAL_ERROR }))
    )
  );
}
