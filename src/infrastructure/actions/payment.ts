'use server';

import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { CreatePaymentResult } from '@application/dto/payment/types';
import { createPayment } from '@application/use-cases/payment';
import { ApiError } from '@infrastructure/api/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { headers } from 'next/headers';

export async function createPaymentAction(params: CreatePaymentInput): Promise<CreatePaymentResult> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip');

  return Effect.runPromise(
    createPayment(params, { userAgent, ipAddress }).pipe(
      Effect.map(({ clientSecret, discountInfo }) => ({
        success: true as const,
        clientSecret,
        discountInfo: discountInfo ?? undefined,
      })),
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed({ success: false as const, error: e.message }),
        PromoCodeError: (e) =>
          Effect.succeed({ success: false as const, error: e.code, isPromoCodeError: true as const }),
        PaymentError: (e) => Effect.succeed({ success: false as const, error: e.message }),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false as const, error: ApiError.INTERNAL_ERROR })),
    ),
  );
}
