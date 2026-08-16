import { ApiError } from '@infrastructure/api/errors';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import type {
  DatabaseError,
  PaymentError,
  RateLimitError,
  SessionError,
  ValidationError,
} from '@infrastructure/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { after } from 'next/server';

interface ActivationResult {
  email: string;
  premiumKey: string;
  token: string;
  deferred: Effect.Effect<void, never, TursoService>;
}

type ActivationFailure = RateLimitError | ValidationError | SessionError | PaymentError | DatabaseError;

export type ActivationOutcome =
  | { status: 200; token: string; email: string; premiumKey: string; error: null }
  | { status: 400 | 429 | 500; token: null; email: null; premiumKey: null; error: string };

const refused = (status: 400 | 429 | 500, error: string): ActivationOutcome => ({
  status,
  token: null,
  email: null,
  premiumKey: null,
  error,
});

export const activatePremiumRequest = (
  program: Effect.Effect<ActivationResult, ActivationFailure, StripeServerService | LoggerService | TursoService>
): Promise<ActivationOutcome> =>
  Effect.runPromise(
    program.pipe(
      Effect.map(({ email, premiumKey, token, deferred }): ActivationOutcome => {
        after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));
        return { status: 200, token, email, premiumKey, error: null };
      }),
      Effect.catchTags({
        RateLimitError: () =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;
            logger.warn('Premium activation rate limited');
            return refused(429, ApiError.RATE_LIMIT_EXCEEDED);
          }),
        ValidationError: (error) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;
            logger.warn('Premium activation refused', { reason: error.message });
            return refused(400, error.message);
          }),
        PaymentError: (error) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;
            logger.error('Premium activation could not reach Stripe', { reason: error.message });
            return refused(500, ApiError.INTERNAL_ERROR);
          }),
        SessionError: (error) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;
            logger.error('Premium activation could not mint a session', { reason: error.message });
            return refused(500, ApiError.INTERNAL_ERROR);
          }),
        DatabaseError: (error) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;
            logger.error('Premium activation could not read the payment', { reason: error.message });
            return refused(500, ApiError.INTERNAL_ERROR);
          }),
      }),
      Effect.provide(ApplicationLayer),
      Effect.catchAll(() => Effect.succeed(refused(500, ApiError.INTERNAL_ERROR)))
    )
  );
