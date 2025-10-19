import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { constructWebhookEvent } from '@infrastructure/clients/payments/stripe/client';
import { processWebhookEvent } from '../processor';

export interface WebhookServiceResult {
  success: boolean;
  error?: string;
}

const logger = getBetterStackInstance();

export const handleStripeWebhook = async (body: string, signature: string): Promise<WebhookServiceResult> => {
  try {
    const event = constructWebhookEvent(body, signature);

    await processWebhookEvent(event);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.logError('Stripe webhook processing failed', error, {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      signaturePrefix: signature?.slice(0, 10),
    });

    return { success: false, error: errorMessage };
  }
};
