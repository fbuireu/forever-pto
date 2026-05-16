'use server';

import type { ContactFormData } from '@application/dto/contact/schema';
import { sendContactEmail } from '@application/use-cases/contact';
import { ApiError } from '@infrastructure/api/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';

export async function sendContactEmailAction(data: ContactFormData) {
  const { env } = getCloudflareContext();
  return Effect.runPromise(
    sendContactEmail(data, { siteUrl: env.NEXT_PUBLIC_SITE_URL, contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL }).pipe(
      Effect.map(() => ({ success: true as const })),
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        ValidationError: (e) => Effect.succeed({ success: false as const, error: e.message }),
        EmailError: (e) => Effect.succeed({ success: false as const, error: e.message }),
      }),
      Effect.catchAll(() => Effect.succeed({ success: false as const, error: ApiError.INTERNAL_ERROR })),
    ),
  );
}
