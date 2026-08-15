import { ValidationError } from '@infrastructure/errors';
import { Effect } from 'effect';

export const INVALID_BODY = 'invalid_body';

export const parseJsonBody = <T = unknown>(request: Request): Effect.Effect<T, ValidationError> =>
  Effect.tryPromise({
    try: (): Promise<unknown> => request.json(),
    catch: () => new ValidationError({ message: INVALID_BODY }),
  }).pipe(
    Effect.flatMap((body) =>
      typeof body === 'object' && body !== null
        ? Effect.succeed(body as T)
        : Effect.fail(new ValidationError({ message: INVALID_BODY }))
    )
  );
