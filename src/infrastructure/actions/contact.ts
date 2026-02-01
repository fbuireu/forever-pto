'use server';

import type { ContactFormData, ContactResult } from '@application/schemas/contact/types';
import { sendContactEmail } from '@application/use-cases/contact';
import { createDefaultDependencies } from '@infrastructure/container/create-dependencies';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function sendContactEmailAction(data: ContactFormData): Promise<ContactResult> {
  const deps = createDefaultDependencies();
  const { env } = getCloudflareContext();

  return sendContactEmail(data, {
    logger: deps.logger,
    emailService: deps.emailService,
    emailRenderer: deps.emailRenderer,
    contactRepository: deps.contactRepository,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    recipientEmail: env.NEXT_PUBLIC_EMAIL_SELF,
  });
}
