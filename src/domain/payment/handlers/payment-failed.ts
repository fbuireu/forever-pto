import { createPaymentError } from '../events/factory/errors';
import type { PaymentFailedEvent } from '../events/types';
import type { PaymentRepository } from '../repository/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

interface HandlePaymentFailedParams {
  paymentRepository: PaymentRepository;
}

export const handlePaymentFailed = async (
  event: PaymentFailedEvent,
  params: HandlePaymentFailedParams
): Promise<void> => {
  try {
    const result = await params.paymentRepository.updateStatus(event.paymentId, event.paymentIntent.status);

    if (!result.success) {
      throw createPaymentError.updateStatusFailed(event.paymentId, result.error);
    }
  } catch (error) {
    getBetterStackInstance().logError('Error handling failed payment', error, { paymentId: event.paymentId });
    throw error;
  }
};
