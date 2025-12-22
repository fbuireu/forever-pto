'use server';

import { type CreatePaymentInput } from '@application/dto/payment/schema';
import type { PaymentDTO } from '@application/dto/payment/types';
import { createPayment } from '@application/use-cases/payment';
import { headers } from 'next/headers';

export async function createPaymentAction(params: CreatePaymentInput): Promise<PaymentDTO> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip');
  return createPayment(params, {
    userAgent,
    ipAddress,
  });
}
