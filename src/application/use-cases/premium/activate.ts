import type { PremiumActivationResult } from '@application/dto/premium/types';
import type { SessionRepository } from '@domain/payment/repository/session';
import { PaymentRepository } from '@domain/payment/repository/types';
import { PaymentValidator } from '@domain/payment/services/validators';

interface ActivatePremiumWithPaymentParams {
  email: string;
  paymentIntentId: string;
}

interface ActivatePremiumWithEmailParams {
  email: string;
}

interface ActivatePremiumDeps {
  sessionRepository: SessionRepository;
  paymentValidator: PaymentValidator;
  paymentRepository: PaymentRepository;
}

export const activateWithPayment = async (
  params: ActivatePremiumWithPaymentParams,
  deps: ActivatePremiumDeps
): Promise<PremiumActivationResult> => {
  const { email, paymentIntentId } = params;

  const validation = await deps.paymentValidator.validatePaymentIntent(paymentIntentId);

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

  const token = await deps.sessionRepository.create({
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
  params: ActivatePremiumWithEmailParams,
  deps: ActivatePremiumDeps
): Promise<PremiumActivationResult> => {
  const { email } = params;

  const paymentResult = await deps.paymentRepository.getByEmail(email);

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

  const token = await deps.sessionRepository.create({
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
