import type { BaseDTO } from '@application/shared/dto/baseDTO';
import type Stripe from 'stripe';
import type { PaymentConfirmationDTO, PaymentData } from './types';
import { extractChargeId, extractCustomerId } from './utils';

export const paymentConfirmationDTO: BaseDTO<Stripe.PaymentIntent, PaymentConfirmationDTO> = {
  create: ({ raw }) => ({
    id: raw.id,
    status: raw.status,
    amount: raw.amount / 100,
    currency: raw.currency.toUpperCase(),
  }),
};

type PaymentDataDTOParams = {
  email: string;
  promoCode: string | null;
  userAgent: string | null;
  ipAddress: string | null;
};

export const paymentDataDTO: BaseDTO<Stripe.PaymentIntent, PaymentData, PaymentDataDTOParams> = {
  create: ({ raw, params }) => {
    if (!params) throw new Error('params required for paymentDataDTO');
    return {
      id: raw.id,
      stripeCreatedAt: new Date(raw.created * 1000),
      customerId: extractCustomerId(raw.customer),
      chargeId: extractChargeId(raw.latest_charge),
      email: params.email,
      amount: raw.amount,
      currency: raw.currency,
      status: raw.status,
      paymentMethodType: raw.payment_method_types?.[0] ?? null,
      description: raw.description ?? null,
      promoCode: params.promoCode,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
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
      origin: null,
    };
  },
};
