import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().min(1, { message: 'Minimum amount is 1' }).max(10000, { message: 'Maximum amount is 10,000' }),
  email: z.email({ message: 'Valid email is required' }).min(1, { message: 'Email is required' }),
  promoCode: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
