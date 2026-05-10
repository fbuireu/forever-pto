import { activateWithEmail, activateWithPayment } from '@application/use-cases/activate-premium';
import { AppLayer } from '@infrastructure/layers';
import { verifySession as verifySessionEffect } from '@infrastructure/services/premium/session';
import { Effect } from 'effect';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PREMIUM_COOKIE = 'premium-token';
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === 'production';

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ premiumKey: null, email: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const response = await Effect.runPromise(
    verifySessionEffect(token).pipe(
      Effect.map((data) => NextResponse.json({ premiumKey: data.paymentIntentId, email: data.email })),
      Effect.catchTag('SessionError', () => {
        const res = NextResponse.json({ premiumKey: null, email: null });
        res.cookies.delete(PREMIUM_COOKIE);
        return Effect.succeed(res);
      })
    )
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, premiumKey } = body as { email?: string; premiumKey?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const result = yield* premiumKey ? activateWithPayment(email, premiumKey) : activateWithEmail(email);

      const response = NextResponse.json({
        success: true,
        premiumKey: result.premiumKey,
        email: result.email,
      });

      response.cookies.set(PREMIUM_COOKIE, result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: THIRTY_DAYS_IN_SECONDS,
        path: '/',
      });

      return response;
    }).pipe(
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (e) =>
          Effect.succeed(NextResponse.json({ error: e.message, premiumKey: null }, { status: 400 })),
        SessionError: () => Effect.succeed(NextResponse.json({ error: 'Internal error' }, { status: 500 })),
        DatabaseError: () => Effect.succeed(NextResponse.json({ error: 'Internal error' }, { status: 500 })),
      }),
      Effect.catchAll(() => Effect.succeed(NextResponse.json({ error: 'Internal error' }, { status: 500 })))
    )
  );
}
