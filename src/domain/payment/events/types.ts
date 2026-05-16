export interface PaymentSucceededEvent {
  type: 'payment_succeeded';
  paymentId: string;
  email: string;
  amount: number;
  status: string;
  latestChargeId: string | null;
  promoCode: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface PaymentFailedEvent {
  type: 'payment_failed';
  paymentId: string;
  status: string;
  errorMessage: string;
}

export type PaymentEvent = PaymentSucceededEvent | PaymentFailedEvent;
