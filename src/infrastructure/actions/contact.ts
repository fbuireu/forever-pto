'use server';

import type { ContactFormData } from '@application/dto/contact/schema';
import type { ContactResult } from '@application/dto/contact/types';
import { sendContactEmail } from '@application/use-cases/contact';
import { AppLayer } from '@infrastructure/layers';
import { Effect } from 'effect';

export async function sendContactEmailAction(data: ContactFormData): Promise<ContactResult> {
  return Effect.runPromise(
    sendContactEmail(data).pipe(
      Effect.map(() => ({ success: true }) as ContactResult),
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed({ success: false, error: e.message } as ContactResult),
        EmailError: (e) => Effect.succeed({ success: false, error: e.message } as ContactResult),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false, error: 'Internal error' } as ContactResult))
    )
  );
}
