'use server';

import type { ContactFormData, ContactResult } from '@application/dto/contact/types';
import { sendContactEmail } from '@application/use-cases/contact';

export async function sendContactEmailAction(data: ContactFormData): Promise<ContactResult> {
  return sendContactEmail(data);
}
