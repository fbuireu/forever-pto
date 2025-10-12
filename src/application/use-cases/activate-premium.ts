import type { PaymentData } from '@application/dto/payment/types';
import type { PremiumActivationResult } from '@application/dto/premium/types';
import type { SessionRepository } from '@domain/payment/repository/session';
import { PaymentRepository } from '@domain/payment/repository/types';
import { PaymentValidator } from '@domain/payment/services/validators';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import type Stripe from 'stripe';

interface ActivatePremiumWithPaymentParams {
  email: string;
  paymentIntentId: string;
}

interface ActivatePremiumWithEmailParams {
  email: string;
}

interface ActivatePremiumParams {
  sessionRepository: SessionRepository;
  paymentValidator: PaymentValidator;
  paymentRepository: PaymentRepository;
}

const buildPaymentDataFromIntent = (paymentIntent: Stripe.PaymentIntent, email: string): PaymentData => {
  return {
    id: paymentIntent.id,
    stripeCreatedAt: new Date(paymentIntent.created * 1000),
    customerId: extractCustomerId(paymentIntent.customer),
    chargeId: extractChargeId(paymentIntent.latest_charge),
    email,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    paymentMethodType: paymentIntent.payment_method_types?.[0] || null,
    description: paymentIntent.description || null,
    promoCode: paymentIntent.metadata.promoCode || null,
    userAgent: paymentIntent.metadata.userAgent || null,
    ipAddress: paymentIntent.metadata.ipAddress || null,
    country: null, 
  };
};

export const activateWithPayment = async (
  input: ActivatePremiumWithPaymentParams,
  params: ActivatePremiumParams
): Promise<PremiumActivationResult> => {
  const { email, paymentIntentId } = input;

  const validation = await params.paymentValidator.validatePaymentIntent(paymentIntentId);

  if (!validation.valid) {
    return {
      success: false,
      premiumKey: null,
      email: null,
      error: validation.error || 'Payment validation failed',
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
    const existingPayment = await params.paymentRepository.getById(paymentIntentId);

    if (existingPayment.success && existingPayment.data) {
      if (existingPayment.data.status !== 'succeeded' && validation.paymentIntent.status === 'succeeded') {
        const updateResult = await params.paymentRepository.updateStatus(paymentIntentId, 'succeeded');

        if (!updateResult.success) {
          console.error('Failed to update payment status:', updateResult.error);
        }
      }
    } else {
      const paymentData = buildPaymentDataFromIntent(validation.paymentIntent, email);
      const saveResult = await params.paymentRepository.save(paymentData);

      if (!saveResult.success) {
        console.error('Failed to save payment to DB:', saveResult.error);
      } else {
        console.log('Payment created successfully');
      }
    }
  }

  const token = await params.sessionRepository.create({
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
  params: ActivatePremiumParams
): Promise<PremiumActivationResult> => {
  const { email } = input;

  const paymentResult = await params.paymentRepository.getByEmail(email);

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

  const token = await params.sessionRepository.create({
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
