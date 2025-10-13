import type { PaymentData } from '@application/dto/payment/types';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import { createPaymentError } from '../events/factory/errors';
import type { PaymentSucceededEvent } from '../events/types';
import { PaymentRepository } from '../repository/types';
import type { ChargeService } from '../services/charge';

interface HandlePaymentSucceededParams {
  paymentRepository: PaymentRepository;
  chargeService: ChargeService;
}

export const handlePaymentSucceeded = async (
  event: PaymentSucceededEvent,
  params: HandlePaymentSucceededParams
): Promise<void> => {
  try {
    const existingPayment = await params.paymentRepository.getById(event.paymentId);

    if (existingPayment.success && existingPayment.data) {
      if (existingPayment.data.status === 'succeeded') {
        await updateChargeDetails(event, params);
        return;
      }

      await updateExistingPayment(event, params.paymentRepository);
    } else {
      console.warn('Payment not found in DB, creating from webhook:', event.paymentId);
      await createPaymentFromWebhook(event, params.paymentRepository);
    }

    await updateChargeDetails(event, params);
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
    userAgent: event.paymentIntent.metadata.userAgent || null,
    ipAddress: event.paymentIntent.metadata.ipAddress || null,
    country: null,
    customerName: null,
    postalCode: null,
    city: null,
    state: null,
    paymentBrand: null,
    paymentLast4: null,
    feeAmount: null,
    netAmount: null,
    refundedAt: null,
    refundReason: null,
    disputedAt: null,
    disputeReason: null,
    parentPaymentId: null,
  };

  const result = await repository.save(paymentData);

  if (!result.success) {
    throw createPaymentError.saveFromWebhookFailed(event.paymentId, result.error);
  }
};

const updateChargeDetails = async (
  event: PaymentSucceededEvent,
  params: HandlePaymentSucceededParams
): Promise<void> => {
  if (!event.paymentIntent.latest_charge) return;

  const chargeId =
    typeof event.paymentIntent.latest_charge === 'string'
      ? event.paymentIntent.latest_charge
      : event.paymentIntent.latest_charge.id;

  try {
    const chargeResult = await params.chargeService.retrieveCharge(chargeId);

    if (!chargeResult.success || !chargeResult.data) {
      console.error('Failed to retrieve charge details:', chargeResult.error);
      return;
    }

    const result = await params.paymentRepository.updateCharge(
      event.paymentId,
      chargeResult.data.id,
      chargeResult.data.receiptUrl,
      chargeResult.data.paymentMethodType,
      chargeResult.data.country,
      chargeResult.data.customerName,
      chargeResult.data.postalCode,
      chargeResult.data.city,
      chargeResult.data.state,
      chargeResult.data.paymentBrand,
      chargeResult.data.paymentLast4,
      chargeResult.data.feeAmount,
      chargeResult.data.netAmount
    );

    if (!result.success) {
      console.error('Failed to update charge details:', result.error);
    }
  } catch (error) {
    console.error('Error fetching charge details:', error);
  }
};
