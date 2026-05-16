import { createPayment } from '@application/use-cases/payment';
import { ApiError } from '@infrastructure/api/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { checkRateLimit } from '@infrastructure/services/payments/rateLimit';
import { Effect } from 'effect';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await request.json();

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* checkRateLimit(ip);

      const { clientSecret, discountInfo } = yield* createPayment(body, {
        userAgent: request.headers.get('user-agent'),
        ipAddress: ip,
      });

      return NextResponse.json({ success: true, clientSecret, discountInfo });
    }).pipe(
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        RateLimitError: () =>
          Effect.succeed(NextResponse.json({ success: false, error: ApiError.RATE_LIMIT_EXCEEDED }, { status: 429 })),
        ValidationError: (e) =>
          Effect.succeed(NextResponse.json({ success: false, error: e.message }, { status: 400 })),
        PromoCodeError: (e) =>
          Effect.succeed(NextResponse.json({ success: false, error: e.code, isPromoCodeError: true }, { status: 400 })),
        PaymentError: () =>
          Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 })),
      }),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 })),
      ),
    ),
  );
}
