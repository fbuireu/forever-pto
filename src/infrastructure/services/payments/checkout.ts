import { createPaymentIntent } from '@app/actions/payment';
import type { PaymentDTOSuccess } from '@application/dto/payment/types';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

export const initializePayment = async (params: {
  amount: number;
  email: string;
  promoCode?: string;
}): Promise<PaymentDTOSuccess> => {
  const result = await createPaymentIntent({
    amount: params.amount,
    email: params.email,
    promoCode: params.promoCode?.trim(),
  });

  if (!result.success) {
    const error = result.success === false ? result.error : 'Payment initialization failed';
    throw new Error(error);
  }

  return result;
};

export const confirmPayment = async (params: {
  stripe: Stripe;
  elements: StripeElements;
  email: string;
  returnUrl: string;
}): Promise<string | null> => {
  const { stripe, elements, email, returnUrl } = params;

  const { error: submitError } = await elements.submit();
  if (submitError) {
    return submitError.message ?? 'An error occurred during submission';
  }

  const { error } = await stripe.confirmPayment({
    elements,
    redirect: 'if_required',
    confirmParams: {
      return_url: returnUrl,
      receipt_email: email,
    },
  });

  return error ? (error.message ?? 'An error occurred during payment') : null;
};
