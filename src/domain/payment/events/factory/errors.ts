export const PAYMENT_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PROMO_CODE: 'INVALID_PROMO_CODE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SAVE_FAILED: 'SAVE_FAILED',
  UPDATE_STATUS_FAILED: 'UPDATE_STATUS_FAILED',
  SAVE_FROM_WEBHOOK_FAILED: 'SAVE_FROM_WEBHOOK_FAILED',
  CHARGE_UPDATE_FAILED: 'CHARGE_UPDATE_FAILED',
  WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type PaymentErrorType = (typeof PAYMENT_ERROR_TYPES)[keyof typeof PAYMENT_ERROR_TYPES];

export interface PaymentError {
  type: PaymentErrorType;
  message?: string;
  code?: string;
  paymentId?: string;
  details?: Record<string, unknown>;
}

export const createPaymentError = {
  validation: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.VALIDATION_ERROR,
    ...(message && { message }),
    details,
  }),

  invalidPromoCode: (code?: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.INVALID_PROMO_CODE,
    ...(message && { message }),
    code,
  }),

  paymentFailed: (message?: string, code?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.PAYMENT_FAILED,
    ...(message && { message }),
    code,
  }),

  saveFailed: (message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.SAVE_FAILED,
    ...(message && { message }),
  }),

  updateStatusFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.UPDATE_STATUS_FAILED,
    ...(message && { message }),
    paymentId,
  }),

  saveFromWebhookFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.SAVE_FROM_WEBHOOK_FAILED,
    ...(message && { message }),
    paymentId,
  }),

  chargeUpdateFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.CHARGE_UPDATE_FAILED,
    ...(message && { message }),
    paymentId,
  }),

  webhookProcessingFailed: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.WEBHOOK_PROCESSING_FAILED,
    ...(message && { message }),
    details,
  }),

  unknown: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.UNKNOWN,
    ...(message && { message }),
    details,
  }),
} as const;
