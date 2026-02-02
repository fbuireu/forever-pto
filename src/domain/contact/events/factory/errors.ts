export const CONTACT_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  SAVE_FAILED: 'SAVE_FAILED',
  RENDER_FAILED: 'RENDER_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ContactErrorType = (typeof CONTACT_ERROR_TYPES)[keyof typeof CONTACT_ERROR_TYPES];

export interface ContactError {
  type: ContactErrorType;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export const createContactError = {
  validation: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.VALIDATION_ERROR,
    ...(message && { message }),
    details,
  }),

  emailSendFailed: (message?: string, code?: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.EMAIL_SEND_FAILED,
    ...(message && { message }),
    code,
  }),

  saveFailed: (message?: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.SAVE_FAILED,
    ...(message && { message }),
  }),

  renderFailed: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.RENDER_FAILED,
    ...(message && { message }),
    details,
  }),

  unknown: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.UNKNOWN,
    ...(message && { message }),
    details,
  }),
} as const;
