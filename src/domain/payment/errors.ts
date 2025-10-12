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
  message: string;
  code?: string;
  paymentId?: string; 
  details?: Record<string, unknown>;
}

const DEFAULT_ERROR_MESSAGES: Record<PaymentErrorType, string> = {
  [PAYMENT_ERROR_TYPES.VALIDATION_ERROR]: 'Invalid input data provided.',
  [PAYMENT_ERROR_TYPES.INVALID_PROMO_CODE]: 'The promotional code is invalid or expired.',
  [PAYMENT_ERROR_TYPES.PAYMENT_FAILED]: 'Payment processing failed.',
  [PAYMENT_ERROR_TYPES.SAVE_FAILED]: 'Payment intent created but failed to save. Please contact support.',
  [PAYMENT_ERROR_TYPES.UPDATE_STATUS_FAILED]: 'Failed to update payment status.',
  [PAYMENT_ERROR_TYPES.SAVE_FROM_WEBHOOK_FAILED]: 'Failed to save payment from webhook.',
  [PAYMENT_ERROR_TYPES.CHARGE_UPDATE_FAILED]: 'Failed to update charge details.',
  [PAYMENT_ERROR_TYPES.WEBHOOK_PROCESSING_FAILED]: 'Failed to process webhook event.',
  [PAYMENT_ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
} as const;

export const createPaymentError = {
  validation: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.VALIDATION_ERROR,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.VALIDATION_ERROR],
    details,
  }),

  invalidPromoCode: (code?: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.INVALID_PROMO_CODE,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.INVALID_PROMO_CODE],
    code,
  }),

  paymentFailed: (message?: string, code?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.PAYMENT_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.PAYMENT_FAILED],
    code,
  }),

  saveFailed: (message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.SAVE_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.SAVE_FAILED],
  }),

  updateStatusFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.UPDATE_STATUS_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.UPDATE_STATUS_FAILED],
    paymentId,
  }),

  saveFromWebhookFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.SAVE_FROM_WEBHOOK_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.SAVE_FROM_WEBHOOK_FAILED],
    paymentId,
  }),

  chargeUpdateFailed: (paymentId: string, message?: string): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.CHARGE_UPDATE_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.CHARGE_UPDATE_FAILED],
    paymentId,
  }),

  webhookProcessingFailed: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.WEBHOOK_PROCESSING_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.WEBHOOK_PROCESSING_FAILED],
    details,
  }),

  unknown: (message?: string, details?: Record<string, unknown>): PaymentError => ({
    type: PAYMENT_ERROR_TYPES.UNKNOWN,
    message: message ?? DEFAULT_ERROR_MESSAGES[PAYMENT_ERROR_TYPES.UNKNOWN],
    details,
  }),
} as const;
