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
}

export const createContactError = {
  validation: (message: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.VALIDATION_ERROR,
    message,
  }),

  emailSendFailed: (): ContactError => ({
    type: CONTACT_ERROR_TYPES.EMAIL_SEND_FAILED,
    message: 'Failed to send email. Please try again.',
  }),

  saveFailed: (): ContactError => ({
    type: CONTACT_ERROR_TYPES.SAVE_FAILED,
    message: 'Email sent but failed to save contact. Please try again.',
  }),

  renderFailed: (): ContactError => ({
    type: CONTACT_ERROR_TYPES.RENDER_FAILED,
    message: 'Failed to prepare email. Please try again.',
  }),

  unknown: (message?: string): ContactError => ({
    type: CONTACT_ERROR_TYPES.UNKNOWN,
    message: message || 'An unexpected error occurred. Please try again.',
  }),
};
