import type { PaymentData } from '@application/dto/payment/types';
import type { PaymentRepository } from '@domain/payment/repository/types';
import type { TursoClient } from '@infrastructure/clients/db/turso/client';

export const savePayment = async (
  turso: TursoClient,
  data: PaymentData
): Promise<{ success: boolean; error?: string }> => {
  const args = [
    data.id,
    data.stripeCreatedAt.toISOString(),
    data.customerId ?? null,
    data.chargeId ?? null,
    data.email,
    data.amount,
    data.currency,
    data.status,
    data.paymentMethodType ?? null,
    data.description ?? null,
    null,
    data.promoCode ?? null,
    data.userAgent ?? null,
    data.ipAddress ?? null,
    data.country ?? null,
    data.customerName ?? null,
    data.postalCode ?? null,
    data.city ?? null,
    data.state ?? null,
    data.paymentBrand ?? null,
    data.paymentLast4 ?? null,
    data.feeAmount ?? null,
    data.netAmount ?? null,
    data.refundedAt?.toISOString() ?? null,
    data.refundReason ?? null,
    data.disputedAt?.toISOString() ?? null,
    data.disputeReason ?? null,
    data.parentPaymentId ?? null,
  ];

  const result = await turso.execute(
    `INSERT OR IGNORE INTO payments (
      id, stripe_created_at, stripe_customer_id, stripe_charge_id,
      email, amount, currency, status, payment_method_type,
      description, receipt_url, promo_code, user_agent, ip_address, country,
      customer_name, postal_code, city, state,
      payment_brand, payment_last4,
      fee_amount, net_amount,
      refunded_at, refund_reason, disputed_at, dispute_reason,
      parent_payment_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args
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
     SET status = ?,
         succeeded_at = CASE WHEN ? = 'succeeded' THEN datetime('now') ELSE succeeded_at END,
         updated_at = datetime('now')
     WHERE id = ?`,
    [status, status, paymentIntentId]
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
): Promise<{ success: boolean; error?: string }> => {
  const result = await turso.execute(
    `UPDATE payments
     SET stripe_charge_id = ?, receipt_url = ?, payment_method_type = ?, country = ?,
         customer_name = ?, postal_code = ?, city = ?, state = ?,
         payment_brand = ?, payment_last4 = ?,
         fee_amount = ?, net_amount = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [
      chargeId,
      receiptUrl,
      paymentMethodType,
      country,
      customerName,
      postalCode,
      city,
      state,
      paymentBrand,
      paymentLast4,
      feeAmount,
      netAmount,
      paymentIntentId,
    ]
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
  const result = await turso.query(`SELECT * FROM payments WHERE id = ? LIMIT 1`, [paymentIntentId]);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.data || result.data.length === 0) {
    return { success: true, data: undefined };
  }

  return {
    success: true,
    data: result.data[0] as PaymentData,
  };
};

export const getPaymentByEmail = async (
  turso: TursoClient,
  email: string
): Promise<{ success: boolean; data?: PaymentData; error?: string }> => {
  const result = await turso.query(
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

  if (!result.data || result.data.length === 0) {
    return { success: true, data: undefined };
  }

  return {
    success: true,
    data: result.data[0] as PaymentData,
  };
};

export const createPaymentRepository = (turso: TursoClient): PaymentRepository => ({
  getById: (paymentId: string) => getPaymentById(turso, paymentId),
  getByEmail: (email: string) => getPaymentByEmail(turso, email),
  save: (payment: PaymentData) => savePayment(turso, payment),
  updateStatus: (paymentId: string, status: string) => updatePaymentStatus(turso, paymentId, status),
  updateCharge: (
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
  ) =>
    updatePaymentCharge(
      turso,
      paymentId,
      chargeId,
      receiptUrl,
      paymentMethodType,
      country,
      customerName,
      postalCode,
      city,
      state,
      paymentBrand,
      paymentLast4,
      feeAmount,
      netAmount
    ),
});
