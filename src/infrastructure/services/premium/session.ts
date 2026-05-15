import type { PremiumSessionData } from '@application/dto/premium/types';
import { SessionError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { jwtVerify, SignJWT } from 'jose';
import { SESSION_DURATION_SECONDS } from './config';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
};

export const createSession = (data: PremiumSessionData): Effect.Effect<string, SessionError> =>
  Effect.tryPromise({
    try: () =>
      new SignJWT({ email: data.email, paymentIntentId: data.paymentIntentId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS)
        .sign(getJWTSecret()),
    catch: (error) =>
      new SessionError({
        message: error instanceof Error ? error.message : String(error),
        cause: error,
      }),
  });

export const verifySession = (token: string): Effect.Effect<{ email: string; paymentIntentId: string }, SessionError> =>
  Effect.tryPromise({
    try: async () => {
      const { payload } = await jwtVerify(token, getJWTSecret());
      return {
        email: payload.email as string,
        paymentIntentId: payload.paymentIntentId as string,
      };
    },
    catch: (error) =>
      new SessionError({
        message: error instanceof Error ? error.message : String(error),
        cause: error,
      }),
  });
