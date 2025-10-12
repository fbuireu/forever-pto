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

    logFailureDetails(event);
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};

const logFailureDetails = (event: PaymentFailedEvent): void => {
  const errorInfo = {
    paymentIntentId: event.paymentId,
    email: event.paymentIntent.metadata.email || event.paymentIntent.receipt_email,
    amount: event.paymentIntent.amount / 100,
    currency: event.paymentIntent.currency.toUpperCase(),
    errorMessage: event.errorMessage,
    errorCode: event.paymentIntent.last_payment_error?.code || null,
  };

  console.error('Payment failed details:', errorInfo);
};
