import type { TursoClient } from '@infrastructure/clients/db/turso/client';
import { updatePaymentCharge } from '@infrastructure/services/payments/repository';
import type { ChargeSucceededEvent } from '../events/types';

interface HandleChargeSucceededDeps {
  db: TursoClient;
}

export const handleChargeSucceeded = async (
  event: ChargeSucceededEvent,
  deps: HandleChargeSucceededDeps
): Promise<void> => {
  console.log('Processing charge succeeded:', event.chargeId);

  if (!event.paymentIntentId) {
    console.error('No payment intent ID found in charge');
    return;
  }

  try {
    const result = await updatePaymentCharge(
      deps.db,
      event.paymentIntentId,
      event.chargeId,
      event.charge.receipt_url,
      event.charge.payment_method_details?.type || null
    );

    if (!result.success) {
      console.error('Failed to update charge info:', result.error);
    } else {
      console.log('Charge info updated successfully:', event.chargeId);
    }
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
    // No lanzamos porque no es crítico
  }
};
