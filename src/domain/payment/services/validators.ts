export interface PaymentValidationResult {
  valid: boolean;
  paymentEmail?: string;
  status?: string;
  error?: string;
}

export interface PaymentValidator {
  validatePaymentIntent(paymentIntentId: string): Promise<PaymentValidationResult>;
}
