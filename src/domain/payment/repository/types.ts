import type { PaymentData } from '@domain/payment/models/types';

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
    country: string | null,
    customerName: string | null,
    postalCode: string | null,
    city: string | null,
    state: string | null,
    paymentBrand: string | null,
    paymentLast4: string | null,
    feeAmount: number | null,
    netAmount: number | null
  ): Promise<{ success: boolean; error?: string }>;
}
