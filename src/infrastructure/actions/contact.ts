'use server';

import type { ContactFormData } from '@application/dto/contact/schema';
import type { ContactResult } from '@application/dto/contact/types';
import { sendContactEmail } from '@application/use-cases/contact';
import { AppLayer } from '@infrastructure/layers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';

export async function sendContactEmailAction(data: ContactFormData): Promise<ContactResult> {
  const { env } = getCloudflareContext();
  return Effect.runPromise(
    sendContactEmail(data, { siteUrl: env.NEXT_PUBLIC_SITE_URL, contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL }).pipe(
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
