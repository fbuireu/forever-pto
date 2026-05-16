'use server';

import type { CreatePaymentInput } from '@application/dto/payment/schema';
import { createPayment } from '@application/use-cases/payment';
import { ApiError } from '@infrastructure/api/errors';
import { AppLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { headers } from 'next/headers';

export async function createPaymentAction(params: CreatePaymentInput) {
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
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed({ success: false as const, error: e.message }),
        PromoCodeError: (e) => Effect.succeed({ success: false as const, error: e.message }),
        PaymentError: (e) => Effect.succeed({ success: false as const, error: e.message }),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false as const, error: ApiError.INTERNAL_ERROR }))
    )
  );
}
