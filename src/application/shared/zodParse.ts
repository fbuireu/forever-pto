import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { ValidationError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { z } from 'zod';

export function zodParse<T>(
  schema: z.ZodType<T>,
  data: unknown
): Effect.Effect<T, ValidationError, LoggerService> {
  return Effect.gen(function* () {
    const logger = yield* LoggerService;
    return yield* Effect.try({
      try: () => schema.parse(data),
      catch: (error) => {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          logger.warn('Validation error', {
            field: firstError?.path.join('.'),
            message: firstError?.message,
            code: firstError?.code,
          });
          return new ValidationError({ message: firstError?.message ?? 'Validation failed' });
        }
        logger.logError('Unexpected validation error', error);
        return new ValidationError({ message: error instanceof Error ? error.message : String(error) });
      },
    });
  });
}
