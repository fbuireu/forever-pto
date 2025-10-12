import { createPaymentError, PaymentError, PaymentErrorType } from "../errors";

export const isPaymentErrorType = (error: PaymentError, type: PaymentErrorType): boolean => {
  return error.type === type;
};

export const fromError = (error: unknown): PaymentError => {
  if (error instanceof Error) {
    return createPaymentError.unknown(error.message, { stack: error.stack });
  }
  return createPaymentError.unknown('Unknown error occurred', { error });
};
