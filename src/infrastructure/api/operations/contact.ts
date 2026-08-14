import type { ContactFormData } from '@application/dto/contact/schema';
import { sendContactEmail } from '@application/use-cases/contact';
import { ApiError } from '@infrastructure/api/errors';
import type { ValidationError } from '@infrastructure/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { after } from 'next/server';
import type { ApiOutcome } from './types';

interface ContactConfig {
  siteUrl: string;
  contactEmail: string;
}

type ContactBody = { success: true } | { success: false; error: string };

export const sendContactRequest = (
  input: Effect.Effect<ContactFormData, ValidationError>,
  config: ContactConfig
): Promise<ApiOutcome<ContactBody>> =>
  Effect.runPromise(
    input.pipe(
      Effect.flatMap((body) => sendContactEmail(body, config)),
      Effect.map(({ deferred }) => {
        after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));
        return { status: 200, body: { success: true as const } };
      }),
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        ValidationError: (error) =>
          Effect.succeed({ status: 400, body: { success: false as const, error: error.message } }),
        EmailError: () =>
          Effect.succeed({ status: 500, body: { success: false as const, error: ApiError.INTERNAL_ERROR } }),
      }),
      Effect.catchAll(() =>
        Effect.succeed({ status: 500, body: { success: false as const, error: ApiError.INTERNAL_ERROR } })
      )
    )
  );
