import { paymentConfirmationDTO } from '@application/dto/payment/dto';
import type { PaymentConfirmationDTO } from '@application/dto/payment/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';

export async function getPaymentConfirmation(paymentIntentId: string): Promise<PaymentConfirmationDTO | null> {
  const stripe = getStripeServerInstance();
  const logger = getBetterStackInstance();

  try {
    const raw = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentConfirmationDTO.create({ raw });
  } catch (error) {
    logger.logError('Failed to retrieve payment intent', error, {
      paymentIntentId,
      service: 'getPaymentConfirmation',
    });
    return null;
  }
}
