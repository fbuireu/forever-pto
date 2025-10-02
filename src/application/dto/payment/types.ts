import Stripe from 'stripe';

export type DiscountInfo = {
  type: 'percent' | 'fixed';
  value: number;
  originalAmount: number;
  finalAmount: number;
  couponId: string;
  couponName: string | null;
};

export type RawPaymentSuccess = {
  type: 'success';
  data: {
    paymentIntent: Stripe.PaymentIntent;
    discountInfo: DiscountInfo | null;
  };
};

export type RawPaymentError = {
  type: 'error';
  error: Error | Stripe.errors.StripeError;
};

export type RawPayment = RawPaymentSuccess | RawPaymentError;

export type PaymentDTO = {
  success: boolean;
  clientSecret?: string;
  error?: string;
  discountInfo?: DiscountInfo;
  stripeError?: Stripe.StripeRawError;
  code?: string;
  type?: string;
};
