'use server';

import type { ContactFormData } from '@application/dto/contact/schema';
import { sendContactRequest } from '@infrastructure/api/operations/contact';
import { getRequestPublicEnv } from '@infrastructure/services/env/getRequestPublicEnv';
import { Effect } from 'effect';

export async function sendContactEmailAction(data: ContactFormData) {
  const { body } = await sendContactRequest(Effect.succeed(data), getRequestPublicEnv());

  return body;
}
