import { BaseDTO } from '@application/shared/dto/baseDTO';
import Stripe from 'stripe';
import { PaymentDTO, RawPayment } from './types';

export const paymentDTO: BaseDTO<RawPayment, PaymentDTO> = {
  create: ({ raw }) => {
    if (raw.type === 'error') {
      const { error } = raw;

      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          error: error.message,
          stripeError: {
            type: error.type,
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          } as unknown as Stripe.StripeRawError,
          code: error.code,
          type: error.type,
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }

    const { paymentIntent, discountInfo } = raw.data;

    if (!paymentIntent.client_secret) {
      return {
        success: false,
        error: 'PaymentIntent missing client_secret',
        type: 'invalid_request_error',
      };
    }

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      discountInfo: discountInfo || undefined,
    };
  },
};
