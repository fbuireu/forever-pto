import type { PaymentData } from '@application/dto/payment/types';
import type { PaymentRepository } from '@domain/payment/repository/types';
import type { TursoClient } from '@infrastructure/clients/db/turso/client';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

export const savePayment = async (
  turso: TursoClient,
  data: PaymentData
): Promise<{ success: boolean; error?: string }> => {
  const logger = getBetterStackInstance();

  // Defensive validation
  if (!data.id || typeof data.id !== 'string' || data.id.length === 0) {
    logger.error('savePayment: Invalid id', {
      id: data.id,
      idType: typeof data.id,
      idLength: data.id?.length,
    });
    return { success: false, error: 'Payment id is required and must be a non-empty string' };
  }

  logger.info('savePayment called', {
    id: data.id,
    idType: typeof data.id,
    idLength: data.id.length,
    email: data.email,
    amount: data.amount,
    status: data.status,
  });

  const args = [
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
    data.userAgent,
    data.ipAddress,
    data.country,
    data.customerName,
    data.postalCode,
    data.city,
    data.state,
    data.paymentBrand,
    data.paymentLast4,
    data.feeAmount,
    data.netAmount,
    data.refundedAt?.toISOString() ?? null,
    data.refundReason,
    data.disputedAt?.toISOString() ?? null,
    data.disputeReason,
    data.parentPaymentId,
  ];

  logger.info('savePayment args prepared', {
    argsLength: args.length,
    firstArg: args[0],
    firstArgType: typeof args[0],
  });

  const result = await turso.execute(
    `INSERT INTO payments (
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
