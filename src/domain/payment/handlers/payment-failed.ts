import type { TursoClient } from '@infrastructure/clients/db/turso/client';
import { updatePaymentStatus } from '@infrastructure/services/payments/repository';
import type { PaymentFailedEvent } from '../events/types';
import { createPaymentError } from '../errors';

interface HandlePaymentFailedDeps {
  db: TursoClient;
}

export const handlePaymentFailed = async (event: PaymentFailedEvent, deps: HandlePaymentFailedDeps): Promise<void> => {
  console.log('Processing failed payment:', event.paymentId);

  try {
    const result = await updatePaymentStatus(deps.db, event.paymentId, event.paymentIntent.status);

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
