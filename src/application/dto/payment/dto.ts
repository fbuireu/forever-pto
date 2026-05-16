import type { BaseDTO } from '@application/shared/dto/baseDTO';
import type { PaymentConfirmationDTO } from './types';
import type Stripe from 'stripe';

export const paymentConfirmationDTO: BaseDTO<Stripe.PaymentIntent, PaymentConfirmationDTO> = {
  create: ({ raw }) => ({
    id: raw.id,
    status: raw.status,
    amount: raw.amount / 100,
    currency: raw.currency.toUpperCase(),
  }),
};
