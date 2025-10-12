import type { PaymentData } from '@application/dto/payment/types';

export interface PaymentRepository {
  getById(paymentId: string): Promise<{ success: boolean; data?: PaymentData; error?: string }>;
  getByEmail(email: string): Promise<{ success: boolean; data?: PaymentData; error?: string }>;
  save(payment: PaymentData): Promise<{ success: boolean; error?: string }>;
  updateStatus(paymentId: string, status: string): Promise<{ success: boolean; error?: string }>;
  updateCharge(
    paymentId: string,
    chargeId: string,
    receiptUrl: string | null,
    paymentMethodType: string | null,
    country: string | null
  ): Promise<{ success: boolean; error?: string }>;
}
