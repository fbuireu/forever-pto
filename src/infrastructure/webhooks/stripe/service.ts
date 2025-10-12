import { constructWebhookEvent } from '@infrastructure/clients/payments/stripe/client';
import { processWebhookEvent } from '../processor';

export interface WebhookServiceResult {
  success: boolean;
  error?: string;
}

export const handleStripeWebhook = async (body: string, signature: string): Promise<WebhookServiceResult> => {
  try {
    const event = constructWebhookEvent(body, signature);

    await processWebhookEvent(event);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('Webhook error:', errorMessage);

    return { success: false, error: errorMessage };
  }
};
 