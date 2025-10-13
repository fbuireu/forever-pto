import { createPaymentError } from '../events/factory/errors';
import type { PaymentFailedEvent } from '../events/types';
import type { PaymentRepository } from '../repository/types';

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
    console.error('Error handling failed payment:', error);
    throw error;
  }
};
