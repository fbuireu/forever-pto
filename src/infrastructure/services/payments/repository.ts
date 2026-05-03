import type { PaymentData } from '@application/dto/payment/types';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import type { DatabaseError } from '@infrastructure/errors';
import { Effect } from 'effect';

export const savePayment = (data: PaymentData): Effect.Effect<void, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    yield* turso.execute(
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
        data.origin ?? null,
      ]
    );
  });

export const updatePaymentStatus = (
  paymentIntentId: string,
  status: string
): Effect.Effect<void, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    yield* turso.execute(
      `UPDATE payments
       SET status = ?,
           succeeded_at = CASE WHEN ? = 'succeeded' THEN datetime('now') ELSE succeeded_at END,
           updated_at = datetime('now')
       WHERE id = ?`,
      [status, status, paymentIntentId]
    );
  });

export const updatePaymentCharge = (
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
): Effect.Effect<void, DatabaseError, TursoService> =>
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
  });

export const getPaymentById = (
  paymentIntentId: string
): Effect.Effect<PaymentData | undefined, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rows = yield* turso.query<PaymentData>('SELECT * FROM payments WHERE id = ? LIMIT 1', [paymentIntentId]);
    return rows[0];
  });

export const getPaymentByEmail = (email: string): Effect.Effect<PaymentData | undefined, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const rows = yield* turso.query<PaymentData>(
      `SELECT * FROM payments WHERE email = ? AND status = 'succeeded' ORDER BY stripe_created_at DESC LIMIT 1`,
      [email]
    );
    return rows[0];
  });
