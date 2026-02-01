import type { PremiumSessionData, SessionRepository, SessionVerificationResult } from '@domain/session/repository/types';
import { SignJWT, jwtVerify } from 'jose';

interface SessionRepositoryConfig {
  jwtSecret: string;
}

const getJWTSecret = (secret: string) => new TextEncoder().encode(secret);

const createSession = async (config: SessionRepositoryConfig, data: PremiumSessionData): Promise<string> => {
  return await new SignJWT({
    email: data.email,
    paymentIntentId: data.paymentIntentId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJWTSecret(config.jwtSecret));
};

const verifySession = async (config: SessionRepositoryConfig, token: string): Promise<SessionVerificationResult> => {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(config.jwtSecret));
    return {
      valid: true,
      data: {
        email: payload.email as string,
        paymentIntentId: payload.paymentIntentId as string,
      },
    };
  } catch {
    return {
      valid: false,
      data: null,
    };
  }
};

export const createSessionRepository = (config: SessionRepositoryConfig): SessionRepository => ({
  create: (data: PremiumSessionData) => createSession(config, data),
  verify: (token: string) => verifySession(config, token),
});
