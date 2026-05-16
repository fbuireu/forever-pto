import type { ContactFormData } from '@application/dto/contact/schema';
import { contactSchema } from '@application/dto/contact/schema';
import { zodParse } from '@application/shared/utils/zodParse';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { ResendService } from '@infrastructure/clients/email/resend/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { EmailError, type ValidationError } from '@infrastructure/errors';
import { saveContact } from '@infrastructure/services/contact/repository';
import { ContactFormEmail } from '@application/email/templates/Contact';
import { render } from '@react-email/render';
import { Effect } from 'effect';

interface ContactEmailConfig {
  siteUrl: string;
  contactEmail: string;
}

export const sendContactEmail = (
  data: ContactFormData,
  config: ContactEmailConfig
): Effect.Effect<void, ValidationError | EmailError, TursoService | ResendService | LoggerService> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;

    const validated = yield* zodParse(contactSchema, data);

    const emailHtml = yield* Effect.tryPromise({
      try: () => render(ContactFormEmail({ ...validated, baseUrl: config.siteUrl })),
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
      from: `Forever PTO <${config.contactEmail}>`,
      to: config.contactEmail,
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
