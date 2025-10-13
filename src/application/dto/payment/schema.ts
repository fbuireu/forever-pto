import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .min(1, 'Minimum amount is 1')
    .max(10000, 'Maximum amount is 10,000'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Valid email is required')
    .min(1, 'Email is required'),
  promoCode: z.string().optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
