import type { NewPayment, PaymentData } from '@application/dto/payment/types';
import type { PaymentStatus } from '@domain/payment/events/types';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import type { DatabaseError } from '@infrastructure/errors';
import { normalizeEmail } from '@infrastructure/services/payments/normalizeEmail';
import { Effect } from 'effect';

export const savePayment = (data: NewPayment): Effect.Effect<boolean, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rowsAffected = yield* turso.execute(
      `INSERT OR IGNORE INTO payments (
        id, stripe_created_at, stripe_customer_id, stripe_charge_id,
        email, amount, currency, status, payment_method_type,
        description, receipt_url, promo_code, user_agent, ip_address, country,
        customer_name, postal_code, city, state,
        payment_brand, payment_last4,
        fee_amount, net_amount,
        refunded_at, refund_reason, disputed_at, dispute_reason,
        parent_payment_id, origin,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
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
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]
    );

    return rowsAffected > 0;
  });

export const updatePaymentStatus = (
  paymentIntentId: string,
  status: PaymentStatus
): Effect.Effect<boolean, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rowsAffected = yield* turso.execute(
      `UPDATE payments
       SET status = ?,
           succeeded_at = CASE WHEN ? = 'succeeded' THEN datetime('now') ELSE succeeded_at END,
           updated_at = datetime('now')
       WHERE id = ? AND status != 'succeeded'`,
      [status, status, paymentIntentId]
    );

    return rowsAffected > 0;
  });

export interface PaymentChargeData {
  paymentIntentId: string;
  chargeId: string;
  receiptUrl: string | null;
  paymentMethodType: string | null;
  country: string | null;
  customerName: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  feeAmount: number | null;
  netAmount: number | null;
}

export const updatePaymentCharge = (data: PaymentChargeData): Effect.Effect<void, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    yield* turso.execute(
      `UPDATE payments
       SET stripe_charge_id = ?, receipt_url = ?, payment_method_type = ?, country = ?,
           customer_name = ?, postal_code = ?, city = ?, state = ?,
           payment_brand = ?, payment_last4 = ?,
           fee_amount = ?, net_amount = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        data.chargeId,
        data.receiptUrl,
        data.paymentMethodType,
        data.country,
        data.customerName,
        data.postalCode,
        data.city,
        data.state,
        data.paymentBrand,
        data.paymentLast4,
        data.feeAmount,
        data.netAmount,
        data.paymentIntentId,
      ]
    );
  });

interface PaymentRow {
  id: string;
  stripe_created_at: string;
  stripe_customer_id: string | null;
  stripe_charge_id: string | null;
  email: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_type: string | null;
  description: string | null;
  promo_code: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  customer_name: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  payment_brand: string | null;
  payment_last4: string | null;
  fee_amount: number | null;
  net_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  parent_payment_id: string | null;
  origin: string | null;
}

const toDate = (value: string | null) => (value ? new Date(value) : null);

const toPaymentData = (row: PaymentRow): PaymentData => ({
  id: row.id,
  stripeCreatedAt: new Date(row.stripe_created_at),
  customerId: row.stripe_customer_id,
  chargeId: row.stripe_charge_id,
  email: row.email,
  amount: row.amount,
  currency: row.currency,
  status: row.status,
  paymentMethodType: row.payment_method_type,
  description: row.description,
  promoCode: row.promo_code,
  userAgent: row.user_agent,
  ipAddress: row.ip_address,
  country: row.country,
  customerName: row.customer_name,
  postalCode: row.postal_code,
  city: row.city,
  state: row.state,
  paymentBrand: row.payment_brand,
  paymentLast4: row.payment_last4,
  feeAmount: row.fee_amount,
  netAmount: row.net_amount,
  refundedAt: toDate(row.refunded_at),
  refundReason: row.refund_reason,
  disputedAt: toDate(row.disputed_at),
  disputeReason: row.dispute_reason,
  parentPaymentId: row.parent_payment_id,
  origin: row.origin,
});

export const getPaymentById = (
  paymentIntentId: string
): Effect.Effect<PaymentData | undefined, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rows = yield* turso.query<PaymentRow>('SELECT * FROM payments WHERE id = ? LIMIT 1', [paymentIntentId]);
    const row = rows[0];
    return row ? toPaymentData(row) : undefined;
  });

export const getSucceededPaymentByEmail = (
  email: string
): Effect.Effect<PaymentData | undefined, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rows = yield* turso.query<PaymentRow>(
      `SELECT * FROM payments WHERE lower(trim(email)) = ? AND status = 'succeeded' ORDER BY stripe_created_at DESC LIMIT 1`,
      [normalizeEmail(email)]
    );
    const row = rows[0];
    return row ? toPaymentData(row) : undefined;
  });

export const normalizePromoCode = (code: string): string => code.trim().toUpperCase();

export const countPromoCodeRedemptions = (code: string): Effect.Effect<number, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rows = yield* turso.query<{ redemptions: number }>(
      `SELECT COUNT(*) AS redemptions FROM payments WHERE upper(trim(promo_code)) = ? AND status = 'succeeded'`,
      [normalizePromoCode(code)]
    );
    return Number(rows[0]?.redemptions ?? 0);
  });
