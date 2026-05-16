import type Stripe from 'stripe';

export interface PaymentConfirmationDTO {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

export type DiscountInfo = {
  type: 'percent' | 'fixed';
  value: number;
  originalAmount: number;
  finalAmount: number;
  couponId: string;
  couponName: string | null;
};

type PaymentDTOSuccess = {
  success: true;
  clientSecret: string;
  discountInfo?: DiscountInfo;
};

type PaymentDTOError = {
  success: false;
  error?: string;
  stripeError?: Stripe.StripeRawError;
  code?: string;
  type?: string;
};

export type PaymentDTO = PaymentDTOSuccess | PaymentDTOError;

export interface PaymentData {
  id: string;
  stripeCreatedAt: Date;
  customerId: string | null;
  chargeId: string | null;
  email: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodType: string | null;
  description: string | null;
  promoCode: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  customerName: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  feeAmount: number | null;
  netAmount: number | null;
  refundedAt: Date | null;
  refundReason: string | null;
  disputedAt: Date | null;
  disputeReason: string | null;
  parentPaymentId: string | null;
  origin: string | null;
}
