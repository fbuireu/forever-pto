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
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

const DEFAULT_ERROR_MESSAGES: Record<ContactErrorType, string> = {
  [CONTACT_ERROR_TYPES.VALIDATION_ERROR]: 'Invalid input data provided.',
  [CONTACT_ERROR_TYPES.EMAIL_SEND_FAILED]: 'Failed to send email. Please try again.',
  [CONTACT_ERROR_TYPES.SAVE_FAILED]: 'Email sent but failed to save contact. Please try again.',
  [CONTACT_ERROR_TYPES.RENDER_FAILED]: 'Failed to prepare email. Please try again.',
  [CONTACT_ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
} as const;

export const createContactError = {
  validation: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.VALIDATION_ERROR,
    message: message ?? DEFAULT_ERROR_MESSAGES[CONTACT_ERROR_TYPES.VALIDATION_ERROR],
    details,
  }),

  emailSendFailed: (message?: string, code?: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.EMAIL_SEND_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[CONTACT_ERROR_TYPES.EMAIL_SEND_FAILED],
    code,
  }),

  saveFailed: (message?: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.SAVE_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[CONTACT_ERROR_TYPES.SAVE_FAILED],
  }),

  renderFailed: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.RENDER_FAILED,
    message: message ?? DEFAULT_ERROR_MESSAGES[CONTACT_ERROR_TYPES.RENDER_FAILED],
    details,
  }),

  unknown: (message?: string, details?: Record<string, unknown>): ContactError => ({
    type: CONTACT_ERROR_TYPES.UNKNOWN,
    message: message ?? DEFAULT_ERROR_MESSAGES[CONTACT_ERROR_TYPES.UNKNOWN],
    details,
  }),
} as const;
