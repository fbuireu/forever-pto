import type { EmailRenderer } from '@application/interfaces/email-renderer';
import { contactSchema } from '@application/schemas/contact/schema';
import type { ContactFormData, ContactResult } from '@application/schemas/contact/types';
import type { ContactRepository } from '@domain/contact/repository/types';
import type { EmailService } from '@domain/contact/services/email';
import { createContactError } from '@domain/contact/events/factory/errors';
import type { Logger } from '@domain/shared/types';
import { z } from 'zod';

export interface SendContactEmailDependencies {
  logger: Logger;
  emailService: EmailService;
  emailRenderer: EmailRenderer;
  contactRepository: ContactRepository;
  siteUrl: string;
  recipientEmail: string;
}

export async function sendContactEmail(
  data: ContactFormData,
  deps: SendContactEmailDependencies
): Promise<ContactResult> {
  const { logger, emailService, emailRenderer, contactRepository, siteUrl, recipientEmail } = deps;

  try {
    const validated = contactSchema.parse(data);

    let emailHtml: string;
    try {
      emailHtml = await emailRenderer.renderContactEmail({ ...validated, baseUrl: siteUrl });
    } catch (error) {
      logger.logError('Contact email render failed', error, {
        emailDomain: validated.email?.split('@')[1],
        name: validated.name,
        subject: validated.subject,
      });
      const renderError = createContactError.renderFailed();
      return { success: false, error: renderError.message };
    }

    const emailResult = await emailService.sendEmail({
      from: 'Forever PTO <contact@forever-pto.com>',
      to: recipientEmail,
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

    const saveResult = await contactRepository.save({
      email: validated.email,
      name: validated.name,
      subject: validated.subject,
      message: validated.message,
      messageId: emailResult.messageId ?? null,
    });

    if (!saveResult.success) {
      logger.error('Failed to save contact to database', {
        reason: saveResult.error,
        emailDomain: validated.email?.split('@')[1],
        messageId: emailResult.messageId,
      });
      const error = createContactError.saveFailed();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      logger.warn('Contact form validation error', {
        field: firstError?.path.join('.'),
        message: firstError?.message,
        code: firstError?.code,
      });
      const validationError = createContactError.validation(firstError?.message ?? 'Invalid form data');
      return { success: false, error: validationError.message };
    }

    logger.logError('Contact form submission error', error, {
      hasEmail: !!data.email,
      hasName: !!data.name,
      hasSubject: !!data.subject,
    });
    const unknownError = createContactError.unknown(error instanceof Error ? error.message : undefined);
    return { success: false, error: unknownError.message };
  }
}
