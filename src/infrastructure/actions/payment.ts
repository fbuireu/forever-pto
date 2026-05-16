'use server';

import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { CreatePaymentResult } from '@application/dto/payment/types';
import { ApiError } from '@infrastructure/api/errors';
import { createPayment } from '@application/use-cases/payment';
import { AppLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { headers } from 'next/headers';

export async function createPaymentAction(params: CreatePaymentInput): Promise<CreatePaymentResult> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip');

  return Effect.runPromise(
    createPayment(params, { userAgent, ipAddress }).pipe(
      Effect.map(
        ({ clientSecret, discountInfo }) =>
          ({
            success: true,
            clientSecret,
            discountInfo: discountInfo ?? undefined,
          }) as CreatePaymentResult
      ),
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed({ success: false, error: e.message } as CreatePaymentResult),
        PromoCodeError: (e) => Effect.succeed({ success: false, error: e.message } as CreatePaymentResult),
        PaymentError: (e) => Effect.succeed({ success: false, error: e.message } as CreatePaymentResult),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false, error: ApiError.INTERNAL_ERROR } as CreatePaymentResult))
    )
  );
}
