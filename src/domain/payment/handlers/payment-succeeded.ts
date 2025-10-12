import type { PaymentData } from '@application/dto/payment/types';
import { createPaymentError } from '../events/factory/errors';
import type { PaymentSucceededEvent } from '../events/types';
import type { ChargeService } from '../services/charge';
import { PaymentRepository } from '../repository/types';

interface HandlePaymentSucceededDeps {
  paymentRepository: PaymentRepository;
  chargeService: ChargeService;
}

export const handlePaymentSucceeded = async (
  event: PaymentSucceededEvent,
  deps: HandlePaymentSucceededDeps
): Promise<void> => {
  try {
    const existingPayment = await deps.paymentRepository.getById(event.paymentId);

    if (existingPayment.success && existingPayment.data) {
      if (existingPayment.data.status === 'succeeded') {
        await updateChargeDetails(event, deps);
        return;
      }

      await updateExistingPayment(event, deps.paymentRepository);
    } else {
      console.warn('Payment not found in DB, creating from webhook:', event.paymentId);
      await createPaymentFromWebhook(event, deps.paymentRepository);
    }

    await updateChargeDetails(event, deps);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

const updateExistingPayment = async (event: PaymentSucceededEvent, repository: PaymentRepository): Promise<void> => {
  const result = await repository.updateStatus(event.paymentId, event.status);

  if (!result.success) {
    throw createPaymentError.updateStatusFailed(event.paymentId, result.error);
  }
};

const createPaymentFromWebhook = async (event: PaymentSucceededEvent, repository: PaymentRepository): Promise<void> => {
  console.warn('Payment not found in DB, creating from webhook:', event.paymentId);

  const paymentData: PaymentData = {
    id: event.paymentIntent.id,
    stripeCreatedAt: new Date(event.paymentIntent.created * 1000),
    customerId: extractCustomerId(event.paymentIntent.customer),
    chargeId: extractChargeId(event.paymentIntent.latest_charge),
    email: event.email,
    amount: event.amount,
    currency: event.paymentIntent.currency,
    status: event.status,
    paymentMethodType: event.paymentIntent.payment_method_types?.[0] || null,
    description: event.paymentIntent.description || null,
    promoCode: event.paymentIntent.metadata.promoCode || null,
  };

  const result = await repository.save(paymentData);

  if (!result.success) {
    throw createPaymentError.saveFromWebhookFailed(event.paymentId, result.error);
  }
};

const updateChargeDetails = async (event: PaymentSucceededEvent, deps: HandlePaymentSucceededDeps): Promise<void> => {
  if (!event.paymentIntent.latest_charge) return;

  const chargeId =
    typeof event.paymentIntent.latest_charge === 'string'
      ? event.paymentIntent.latest_charge
      : event.paymentIntent.latest_charge.id;

  try {
    const chargeResult = await deps.chargeService.retrieveCharge(chargeId);

    if (!chargeResult.success || !chargeResult.data) {
      console.error('Failed to retrieve charge details:', chargeResult.error);
      return;
    }

    const result = await deps.paymentRepository.updateCharge(
      event.paymentId,
      chargeResult.data.id,
      chargeResult.data.receiptUrl,
      chargeResult.data.paymentMethodType
    );

    if (!result.success) {
      console.error('Failed to update charge details:', result.error);
    }
  } catch (error) {
    console.error('Error fetching charge details:', error);
  }
};

const extractCustomerId = (customer: unknown): string | null => {
  if (typeof customer === 'string') return customer;
  if (customer && typeof customer === 'object' && 'id' in customer) {
    return (customer as { id: string }).id;
  }
  return null;
};

const extractChargeId = (charge: unknown): string | null => {
  if (typeof charge === 'string') return charge;
  if (charge && typeof charge === 'object' && 'id' in charge) {
    return (charge as { id: string }).id;
  }
  return null;
};
