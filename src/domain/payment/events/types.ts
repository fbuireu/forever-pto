import type Stripe from 'stripe';

export interface PaymentSucceededEvent {
  type: 'payment_succeeded';
  paymentIntent: Stripe.PaymentIntent;
  paymentId: string;
  email: string;
  amount: number;
  status: string;
}

export interface PaymentFailedEvent {
  type: 'payment_failed';
  paymentIntent: Stripe.PaymentIntent;
  paymentId: string;
  errorMessage: string;
}

export type PaymentEvent = PaymentSucceededEvent | PaymentFailedEvent;
