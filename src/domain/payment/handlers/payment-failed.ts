import { createPaymentError } from '../events/factory/errors';
import type { PaymentFailedEvent } from '../events/types';
import { PaymentRepository } from '../repository/types';

interface HandlePaymentFailedDeps {
  paymentRepository: PaymentRepository;
}

export const handlePaymentFailed = async (event: PaymentFailedEvent, deps: HandlePaymentFailedDeps): Promise<void> => {
  try {
    const result = await deps.paymentRepository.updateStatus(event.paymentId, event.paymentIntent.status);

    if (!result.success) {
      throw createPaymentError.updateStatusFailed(event.paymentId, result.error);
    }

  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};
