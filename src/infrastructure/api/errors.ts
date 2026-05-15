export const ApiError = {
  INTERNAL_ERROR: 'internal_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  EMAIL_REQUIRED: 'email_required',
  MISSING_SIGNATURE: 'missing_signature',
  INVALID_SIGNATURE: 'invalid_signature',
  WEBHOOK_PROCESSING_FAILED: 'webhook_processing_failed',
} as const;

export type ApiErrorCode = (typeof ApiError)[keyof typeof ApiError];
