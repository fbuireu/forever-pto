import { z } from 'zod';

export interface PaymentSchemaMessages {
  amountMin: string;
  amountMax: string;
  invalidEmail: string;
  emailRequired: string;
}

export const createPaymentSchemaWithMessages = (messages: PaymentSchemaMessages) =>
  z.object({
    amount: z.number().min(1, { message: messages.amountMin }).max(10000, { message: messages.amountMax }),
    email: z.email({ message: messages.invalidEmail }).min(1, { message: messages.emailRequired }),
    promoCode: z.string().optional(),
  });

export const createPaymentSchema = createPaymentSchemaWithMessages({
  amountMin: 'amount_too_low',
  amountMax: 'amount_too_high',
  invalidEmail: 'invalid_email',
  emailRequired: 'email_required',
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
