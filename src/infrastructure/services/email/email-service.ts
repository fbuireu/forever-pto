import type { SendEmailParams, SendEmailResult } from '@application/dto/email/types';
import type { EmailService } from '@domain/contact/services/email';
import type { ResendClient } from '@infrastructure/clients/email/resend/client';

const sendEmail = async (resend: ResendClient, params: SendEmailParams): Promise<SendEmailResult> => {
  return resend.send(params);
};

export const createEmailService = (resend: ResendClient): EmailService => ({
  sendEmail: (params: SendEmailParams) => sendEmail(resend, params),
});
