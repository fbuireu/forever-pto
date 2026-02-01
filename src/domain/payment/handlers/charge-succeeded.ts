import type { Logger } from '@domain/shared/types';
import type { ChargeSucceededEvent } from '../events/types';
import type { PaymentRepository } from '../repository/types';

interface HandleChargeSucceededParams {
  paymentRepository: PaymentRepository;
  logger: Logger;
}

export const handleChargeSucceeded = async (
  event: ChargeSucceededEvent,
  params: HandleChargeSucceededParams
): Promise<void> => {
  if (!event.paymentIntentId) {
    params.logger.warn('No payment intent ID found in charge', { chargeId: event.chargeId });
    return;
  }

  try {
    const billingDetails = event.charge.billing_details;
    const paymentMethodDetails = event.charge.payment_method_details;
    const netAmount = event.charge.amount - (event.charge.application_fee_amount ?? 0);

    const result = await params.paymentRepository.updateCharge(
      event.paymentIntentId,
      event.chargeId,
      event.charge.receipt_url,
      paymentMethodDetails?.type ?? null,
      billingDetails?.address?.country ?? null,
      billingDetails?.name ?? null,
      billingDetails?.address?.postal_code ?? null,
      billingDetails?.address?.city ?? null,
      billingDetails?.address?.state ?? null,
      paymentMethodDetails?.card?.brand ?? null,
      paymentMethodDetails?.card?.last4 ?? null,
      event.charge.application_fee_amount ?? null,
      netAmount
    );

    if (!result.success) {
      params.logger.warn('Failed to update charge info', { reason: result.error, chargeId: event.chargeId, paymentIntentId: event.paymentIntentId });
    } else {
      params.logger.info('Charge info updated successfully', { chargeId: event.chargeId });
    }
  } catch (error) {
    params.logger.logError('Error handling charge succeeded', error, { chargeId: event.chargeId });
  }
};
