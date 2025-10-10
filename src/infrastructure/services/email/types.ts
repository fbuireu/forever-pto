export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailSender = (params: SendEmailParams) => Promise<SendEmailResult>;
