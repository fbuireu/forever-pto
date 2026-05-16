import { activateWithEmail, activateWithPayment } from '@application/use-cases/activate-premium';
import { ApiError } from '@infrastructure/api/errors';
import { noStore } from '@infrastructure/api/response';
import { AppLayer } from '@infrastructure/layers';
import { PREMIUM_COOKIE } from '@infrastructure/services/premium/config';
import { clearPremiumCookie, setPremiumCookie } from '@infrastructure/services/premium/cookie';
import { verifySession as verifySessionEffect } from '@infrastructure/services/premium/session';
import { Effect } from 'effect';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) return noStore({ premiumKey: null, email: null });

  const response = await Effect.runPromise(
    verifySessionEffect(token).pipe(
      Effect.map((data) => noStore({ premiumKey: data.paymentIntentId, email: data.email })),
      Effect.catchTag('SessionError', () => {
        const res = noStore({ premiumKey: null, email: null });
        clearPremiumCookie(res);
        return Effect.succeed(res);
      })
    )
  );

  return response;
}

export async function POST(request: NextRequest) {
  const body: Record<string, unknown> = await request.json();
  const email = typeof body.email === 'string' ? body.email : undefined;
  const premiumKey = typeof body.premiumKey === 'string' ? body.premiumKey : undefined;

  if (!email) {
    return noStore({ error: ApiError.EMAIL_REQUIRED }, { status: 400 });
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const result = yield* premiumKey ? activateWithPayment(email, premiumKey) : activateWithEmail(email);

      const response = noStore({ success: true, premiumKey: result.premiumKey, email: result.email });

      setPremiumCookie(response, result.token);

      return response;
    }).pipe(
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed(noStore({ error: e.message, premiumKey: null }, { status: 400 })),
        SessionError: () => Effect.succeed(noStore({ error: ApiError.INTERNAL_ERROR }, { status: 500 })),
        DatabaseError: () => Effect.succeed(noStore({ error: ApiError.INTERNAL_ERROR }, { status: 500 })),
      }),
      Effect.catchAll(() => Effect.succeed(noStore({ error: ApiError.INTERNAL_ERROR }, { status: 500 })))
    )
  );
}
