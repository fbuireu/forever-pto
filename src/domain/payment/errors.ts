export const PAYMENT_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PROMO_CODE: 'INVALID_PROMO_CODE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SAVE_FAILED: 'SAVE_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type PaymentErrorType = (typeof PAYMENT_ERROR_TYPES)[keyof typeof PAYMENT_ERROR_TYPES];

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
}

export const createPaymentError = {
  validation: (message: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.VALIDATION_ERROR,
    message,
  }),

  invalidPromoCode: (message: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.INVALID_PROMO_CODE,
    message,
  }),

  paymentFailed: (message: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.PAYMENT_FAILED,
    message,
  }),

  saveFailed: (): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.SAVE_FAILED,
    message: 'Payment intent created but failed to save. Please contact support.',
  }),

  unknown: (message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.UNKNOWN,
    message: message || 'An unexpected error occurred. Please try again.',
  }),
};
