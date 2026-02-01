import type { PaymentIntentResult } from '@application/interfaces/payment-services';
import type { DiscountInfo } from '@domain/payment/models/types';
import type Stripe from 'stripe';

export type RawPaymentSuccess = {
  type: 'success';
  data: {
    paymentIntent: PaymentIntentResult;
    discountInfo: DiscountInfo | null;
  };
};

export type RawPaymentError = {
  type: 'error';
  error: Error | Stripe.errors.StripeError;
};

export type RawPayment = RawPaymentSuccess | RawPaymentError;

export type PaymentDTOSuccess = {
  success: true;
  clientSecret: string;
  discountInfo?: DiscountInfo;
};

export type PaymentDTOError = {
  success: false;
  error: string;
  stripeError?: Stripe.StripeRawError;
  code?: string;
  type?: string;
};

export type PaymentDTO = PaymentDTOSuccess | PaymentDTOError;
