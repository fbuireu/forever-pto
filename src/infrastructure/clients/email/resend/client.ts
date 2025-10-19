import type { SendEmailParams, SendEmailResult } from '@application/dto/email/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Resend } from 'resend';

export interface ResendConfig {
  apiKey: string;
}

export class ResendClient {
  private resend: Resend | null = null;
  private readonly config: ResendConfig;
  private logger = getBetterStackInstance();

  constructor(config: ResendConfig) {
    this.config = config;
  }

  private getResend(): Resend {
    this.resend ??= new Resend(this.config.apiKey);
    return this.resend;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const resend = this.getResend();
      const { data, error } = await resend.emails.send(params);

      if (error) {
        this.logger.error('Resend email send failed with API error', {
          errorMessage: error.message,
          errorName: error.name,
          from: params.from,
          to: params.to,
          subject: params.subject,
          hasTags: !!params.tags,
        });
        return {
          success: false,
          error: error.message ?? 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      this.logger.logError('Resend email send failed with exception', error, {
        from: params.from,
        to: params.to,
        subject: params.subject,
        hasTags: !!params.tags,
      });
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): SendEmailResult {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected email error occurred. Please try again.',
    };
  }

  isInitialized(): boolean {
    return this.resend !== null;
  }
}

let resendClientInstance: ResendClient | null = null;

export const getResendClientInstance = (): ResendClient => {
  if (!resendClientInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY must be defined');
    }

    resendClientInstance = new ResendClient({ apiKey });
  }

  return resendClientInstance;
};
