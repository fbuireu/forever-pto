import z from 'zod';

interface ContactSchemaMessages {
  invalidEmail: string;
  emailRequired: string;
  nameMin: string;
  nameMax: string;
  subjectMin: string;
  subjectMax: string;
  messageMin: string;
  messageMax: string;
}

export const NAME_MIN_LENGTH = 2;
export const SUBJECT_MIN_LENGTH = 5;
export const MESSAGE_MIN_LENGTH = 10;

export const createContactSchema = (messages: ContactSchemaMessages) =>
  z.object({
    email: z.email(messages.invalidEmail).min(1, messages.emailRequired),
    name: z.string().min(NAME_MIN_LENGTH, messages.nameMin).max(100, messages.nameMax),
    subject: z.string().min(SUBJECT_MIN_LENGTH, messages.subjectMin).max(200, messages.subjectMax),
    message: z.string().min(MESSAGE_MIN_LENGTH, messages.messageMin).max(1000, messages.messageMax),
  });

export const contactSchema = createContactSchema({
  invalidEmail: 'invalid_email',
  emailRequired: 'email_required',
  nameMin: 'name_too_short',
  nameMax: 'name_too_long',
  subjectMin: 'subject_too_short',
  subjectMax: 'subject_too_long',
  messageMin: 'message_too_short',
  messageMax: 'message_too_long',
});

export type ContactFormData = z.infer<typeof contactSchema>;
