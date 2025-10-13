import { type ContactError, type ContactErrorType, createContactError } from '../events/factory/errors';

export const isContactErrorType = (error: ContactError, type: ContactErrorType): boolean => {
  return error.type === type;
};

export const fromError = (error: unknown): ContactError => {
  if (error instanceof Error) {
    return createContactError.unknown(error.message, { stack: error.stack });
  }
  return createContactError.unknown('Unknown error occurred', { error });
};
