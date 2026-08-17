import type { BaseDTO } from '@application/shared/dto/baseDTO';
import type Stripe from 'stripe';
import type { NewPayment, PaymentConfirmationDTO } from './types';
import { extractChargeId, extractCustomerId } from './utils/helpers';

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

export const paymentDataDTO: BaseDTO<Stripe.PaymentIntent, NewPayment, PaymentDataDTOParams> = {
  create: ({ raw, params }) => {
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
    };
  },
};
