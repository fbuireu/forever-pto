import { contactSchema } from '@application/dto/contact/schema';
import type { ContactFormData } from '@application/dto/contact/schema';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { ResendService } from '@infrastructure/clients/email/resend/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { EmailError, ValidationError } from '@infrastructure/errors';
import { saveContact } from '@infrastructure/services/contact/repository';
import { ContactFormEmail } from '@infrastructure/services/email/templates/Contact';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { render } from '@react-email/render';
import { Effect } from 'effect';
import { z } from 'zod';

export const sendContactEmail = (
  data: ContactFormData
): Effect.Effect<void, ValidationError | EmailError, TursoService | ResendService | LoggerService> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;

    const validated = yield* Effect.try({
      try: () => contactSchema.parse(data),
      catch: (error) => {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          logger.warn('Contact form validation error', {
            field: firstError?.path.join('.'),
            message: firstError?.message,
            code: firstError?.code,
          });
          return new ValidationError({ message: firstError?.message ?? 'Validation failed' });
        }
        logger.logError('Contact form submission error', error, {
          hasEmail: !!data.email,
          hasName: !!data.name,
          hasSubject: !!data.subject,
        });
        return new ValidationError({ message: error instanceof Error ? error.message : String(error) });
      },
    });

    const { env } = yield* Effect.try({
      try: () => getCloudflareContext(),
      catch: (error) => {
        logger.logError('Contact form submission error', error, {
          hasEmail: !!data.email,
          hasName: !!data.name,
          hasSubject: !!data.subject,
        });
        return new EmailError({ message: error instanceof Error ? error.message : String(error), cause: error });
      },
    });

    const emailHtml = yield* Effect.tryPromise({
      try: () => render(ContactFormEmail({ ...validated, baseUrl: env.NEXT_PUBLIC_SITE_URL })),
      catch: (error) => {
        logger.logError('Contact email render failed', error, {
          emailDomain: validated.email?.split('@')[1],
          name: validated.name,
          subject: validated.subject,
        });
        return new EmailError({ message: 'Email render failed', cause: error });
      },
    });

    const resend = yield* ResendService;
    const { messageId } = yield* resend.send({
      from: `Forever PTO <${env.NEXT_PUBLIC_CONTACT_EMAIL}>`,
      to: env.NEXT_PUBLIC_CONTACT_EMAIL,
      subject: `[Forever PTO Contact] ${validated.subject}`,
      html: emailHtml,
      replyTo: validated.email,
      tags: [{ name: 'category', value: 'web_contact_form' }],
    });

    yield* saveContact({
      email: validated.email,
      name: validated.name,
      subject: validated.subject,
      message: validated.message,
      messageId: messageId ?? null,
      origin: null,
    }).pipe(
      Effect.catchAll((e) =>
        Effect.sync(() => {
          logger.error('Failed to save contact to database', {
            reason: e.message,
            emailDomain: validated.email?.split('@')[1],
            messageId: messageId ?? undefined,
          });
        })
      )
    );
  });
