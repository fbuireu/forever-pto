'use server';

import { contactSchema } from '@application/dto/contact/schema';
import type { ContactFormData, ContactResult } from '@application/dto/contact/types';
import { createContactError } from '@domain/contact/errors';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getResendClient } from '@infrastructure/clients/email/resend/client';
import { saveContact } from '@infrastructure/services/contact/repository';
import { ContactFormEmail } from '@infrastructure/services/email/templates/Contact';
import { render } from '@react-email/render';
import { z } from 'zod';

const turso = getTursoClient();
const resend = getResendClient();

export async function sendContactEmail(data: ContactFormData): Promise<ContactResult> {
  try {
    const validated = contactSchema.parse(data);

    let emailHtml: string;
    try {
      emailHtml = await render(ContactFormEmail(validated));
    } catch (error) {
      console.error('Email render error:', error);
      const renderError = createContactError.renderFailed();
      return { success: false, error: renderError.message };
    }

    const emailResult = await resend.send({
      from: 'Forever PTO <contact@forever-pto.com>',
      to: 'your@email.com',
      subject: `[Forever PTO Contact] ${validated.subject}`,
      html: emailHtml,
      replyTo: validated.email,
      tags: [
        {
          name: 'category',
          value: 'web_contact_form',
        },
      ],
    });

    if (!emailResult.success) {
      const error = createContactError.emailSendFailed();
      return { success: false, error: error.message };
    }

    const saveResult = await saveContact(turso, {
      email: validated.email,
      name: validated.name,
      subject: validated.subject,
      message: validated.message,
      messageId: emailResult.messageId || null,
    });

    if (!saveResult.success) {
      console.error('Failed to save contact to database:', saveResult.error);
      const error = createContactError.saveFailed();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      const validationError = createContactError.validation(firstError?.message || 'Invalid form data');
      return { success: false, error: validationError.message };
    }

    console.error('Contact form error:', error);
    const unknownError = createContactError.unknown(error instanceof Error ? error.message : undefined);
    return { success: false, error: unknownError.message };
  }
}
