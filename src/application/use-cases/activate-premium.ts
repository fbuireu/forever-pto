import type { PaymentHelpers } from '@application/interfaces/payment-services';
import type { PaymentData } from '@domain/payment/models/types';
import type { PremiumActivationResult } from '@application/use-cases/premium/types';
import type { PaymentRepository } from '@domain/payment/repository/types';
import type { PaymentValidator } from '@domain/payment/services/validators';
import type { SessionRepository } from '@domain/session/repository/types';
import type { Logger } from '@domain/shared/types';
import type Stripe from 'stripe';

interface ActivatePremiumWithPaymentParams {
  email: string;
  paymentIntentId: string;
}

interface ActivatePremiumWithEmailParams {
  email: string;
}

export interface ActivatePremiumDependencies {
  logger: Logger;
  sessionRepository: SessionRepository;
  paymentValidator: PaymentValidator;
  paymentRepository: PaymentRepository;
  paymentHelpers: PaymentHelpers;
}

const buildPaymentDataFromIntent = (
  paymentIntent: Stripe.PaymentIntent,
  email: string,
  helpers: PaymentHelpers
): PaymentData => {
  return {
    id: paymentIntent.id,
    stripeCreatedAt: new Date(paymentIntent.created * 1000),
    customerId: helpers.extractCustomerId(paymentIntent.customer),
    chargeId: helpers.extractChargeId(paymentIntent.latest_charge),
    email,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    paymentMethodType: paymentIntent.payment_method_types?.[0] ?? null,
    description: paymentIntent.description ?? null,
    promoCode: paymentIntent.metadata.promoCode ?? null,
    userAgent: paymentIntent.metadata.userAgent ?? null,
    ipAddress: paymentIntent.metadata.ipAddress ?? null,
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
};

export const activateWithPayment = async (
  input: ActivatePremiumWithPaymentParams,
  deps: ActivatePremiumDependencies
): Promise<PremiumActivationResult> => {
  const { email, paymentIntentId } = input;
  const { logger, paymentValidator, paymentRepository, sessionRepository, paymentHelpers } = deps;

  const validation = await paymentValidator.validatePaymentIntent(paymentIntentId);

  if (!validation.valid) {
    return {
      success: false,
      premiumKey: null,
      email: null,
      error: validation.error ?? 'Payment validation failed',
    };
  }

  if (validation.paymentEmail && validation.paymentEmail !== email) {
    return {
      success: false,
      premiumKey: null,
      email: null,
      error: 'Email mismatch',
    };
  }

  if (validation.paymentIntent) {
    const existingPayment = await paymentRepository.getById(paymentIntentId);

    if (existingPayment.success && existingPayment.data) {
      if (existingPayment.data.status !== 'succeeded' && validation.paymentIntent.status === 'succeeded') {
        const updateResult = await paymentRepository.updateStatus(paymentIntentId, 'succeeded');

        if (!updateResult.success) {
          logger.error('Failed to update payment status', { reason: updateResult.error, paymentIntentId, emailDomain: email?.split('@')[1] });
        }
      }
    } else {
      const paymentData = buildPaymentDataFromIntent(validation.paymentIntent, email, paymentHelpers);
      const saveResult = await paymentRepository.save(paymentData);

      if (!saveResult.success) {
        logger.error('Failed to save payment to DB', { reason: saveResult.error, paymentIntentId, emailDomain: email?.split('@')[1] });
      } else {
        logger.info('Payment created successfully', { paymentIntentId });
      }
    }
  }

  const token = await sessionRepository.create({
    email,
    paymentIntentId,
  });

  return {
    success: true,
    premiumKey: paymentIntentId,
    email,
    token,
  };
};

export const activateWithEmail = async (
  input: ActivatePremiumWithEmailParams,
  deps: ActivatePremiumDependencies
): Promise<PremiumActivationResult> => {
  const { email } = input;
  const { paymentRepository, sessionRepository } = deps;

  const paymentResult = await paymentRepository.getByEmail(email);

  if (!paymentResult.success || !paymentResult.data) {
    return {
      success: false,
      premiumKey: null,
      email: null,
      error: 'No payment found',
    };
  }

  const payment = paymentResult.data;

  if (payment.status !== 'succeeded') {
    return {
      success: false,
      premiumKey: null,
      email: null,
      error: `Payment status is ${payment.status}`,
    };
  }

  const token = await sessionRepository.create({
    email,
    paymentIntentId: payment.id,
  });

  return {
    success: true,
    premiumKey: payment.id,
    email,
    token,
  };
};
