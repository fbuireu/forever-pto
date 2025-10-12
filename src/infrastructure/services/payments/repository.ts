import type { PaymentData } from '@application/dto/payment/types';
import { PaymentRepository } from '@domain/payment/repository/types';
import type { TursoClient } from '@infrastructure/clients/db/turso/client';

export const savePayment = async (
  turso: TursoClient,
  data: PaymentData
): Promise<{ success: boolean; error?: string }> => {
  const result = await turso.execute(
    `INSERT INTO payments (
      id, stripe_created_at, stripe_customer_id, stripe_charge_id,
      email, amount, currency, status, payment_method_type,
      description, receipt_url, promo_code, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      data.id,
      data.stripeCreatedAt.toISOString(),
      data.customerId,
      data.chargeId,
      data.email,
      data.amount,
      data.currency,
      data.status,
      data.paymentMethodType,
      data.description,
      null,
      data.promoCode,
    ]
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
};

export const updatePaymentStatus = async (
  turso: TursoClient,
  paymentIntentId: string,
  status: string
): Promise<{ success: boolean; error?: string }> => {
  const result = await turso.execute(
    `UPDATE payments
     SET status = ?, succeeded_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
    [status, paymentIntentId]
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
};

export const updatePaymentCharge = async (
  turso: TursoClient,
  paymentIntentId: string,
  chargeId: string,
  receiptUrl: string | null,
  paymentMethodType: string | null
): Promise<{ success: boolean; error?: string }> => {
  const result = await turso.execute(
    `UPDATE payments
     SET stripe_charge_id = ?, receipt_url = ?, payment_method_type = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [chargeId, receiptUrl, paymentMethodType, paymentIntentId]
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
};

export const getPaymentById = async (
  turso: TursoClient,
  paymentIntentId: string
): Promise<{ success: boolean; data?: PaymentData; error?: string }> => {
  const result = await turso.execute(`SELECT * FROM payments WHERE id = ? LIMIT 1`, [paymentIntentId]);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.data || (result.data as unknown[]).length === 0) {
    return { success: true, data: undefined };
  }

  return {
    success: true,
    data: (result.data as unknown[])[0] as PaymentData,
  };
};

export const getPaymentByEmail = async (
  turso: TursoClient,
  email: string
): Promise<{ success: boolean; data?: PaymentData; error?: string }> => {
  const result = await turso.execute(
    `SELECT * FROM payments
     WHERE email = ?
     AND status = 'succeeded'
     ORDER BY stripe_created_at DESC
     LIMIT 1`,
    [email]
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.data || (result.data as unknown[]).length === 0) {
    return { success: true, data: undefined };
  }

  return {
    success: true,
    data: (result.data as unknown[])[0] as PaymentData,
  };
};

export const createPaymentRepository = (turso: TursoClient): PaymentRepository => ({
  getById: (paymentId: string) => getPaymentById(turso, paymentId),
  getByEmail: (email: string) => getPaymentByEmail(turso, email),
  save: (payment: PaymentData) => savePayment(turso, payment),
  updateStatus: (paymentId: string, status: string) => updatePaymentStatus(turso, paymentId, status),
  updateCharge: (paymentId: string, chargeId: string, receiptUrl: string | null, paymentMethodType: string | null) =>
    updatePaymentCharge(turso, paymentId, chargeId, receiptUrl, paymentMethodType),
});
