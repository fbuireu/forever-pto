export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}
