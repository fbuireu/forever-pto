import { z } from 'zod';

interface PaymentSchemaMessages {
  amountMin: string;
  amountMax: string;
  invalidEmail: string;
  emailRequired: string;
  promoCodeTooLong: string;
}

export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 10000;
const EMAIL_MAX_LENGTH = 254;
const PROMO_CODE_MAX_LENGTH = 100;

export const createPaymentSchemaWithMessages = (messages: PaymentSchemaMessages) =>
  z.object({
    amount: z
      .number()
      .min(AMOUNT_MIN, { message: messages.amountMin })
      .max(AMOUNT_MAX, { message: messages.amountMax }),
    email: z
      .email({ message: messages.invalidEmail })
      .min(1, { message: messages.emailRequired })
      .max(EMAIL_MAX_LENGTH, { message: messages.invalidEmail }),
    promoCode: z.string().max(PROMO_CODE_MAX_LENGTH, { message: messages.promoCodeTooLong }).optional(),
  });

export const createPaymentSchema = createPaymentSchemaWithMessages({
  amountMin: 'amount_too_low',
  amountMax: 'amount_too_high',
  invalidEmail: 'invalid_email',
  emailRequired: 'email_required',
  promoCodeTooLong: 'promo_code_too_long',
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
