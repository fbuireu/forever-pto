import type { SendEmailParams, SendEmailResult } from '@application/dto/email/types';

export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
