import { TursoService } from '@infrastructure/clients/db/turso/service';
import { DatabaseError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentChargeData } from './repository';

const { savePayment, updatePaymentStatus, updatePaymentCharge, getPaymentById, getPaymentByEmail } =
  await import('./repository');

const mockExecute = vi.fn();
const mockQuery = vi.fn();

const MockTursoLayer = Layer.succeed(TursoService, {
  execute: mockExecute,
  query: mockQuery,
  batch: vi.fn(),
});

const runEffect = <A>(effect: Effect.Effect<A, DatabaseError, TursoService>) =>
  Effect.runPromise(effect.pipe(Effect.provide(MockTursoLayer)));

const runFlipEffect = (effect: Effect.Effect<unknown, DatabaseError, TursoService>) =>
  Effect.runPromise(effect.pipe(Effect.provide(MockTursoLayer), Effect.flip));

const BASE_PAYMENT = {
  id: 'pi_test',
  stripeCreatedAt: new Date('2024-01-15T10:00:00Z'),
  customerId: 'cus_123',
  chargeId: 'ch_123',
  email: 'user@example.com',
  amount: 1000,
  currency: 'eur',
  status: 'succeeded',
  paymentMethodType: 'card',
  description: 'Donation',
  promoCode: null,
  userAgent: 'Mozilla/5.0',
  ipAddress: '1.2.3.4',
  country: 'ES',
  customerName: 'Test User',
  postalCode: '08001',
  city: 'Barcelona',
  state: null,
  paymentBrand: 'visa',
  paymentLast4: '4242',
  feeAmount: 30,
  netAmount: 970,
  refundedAt: null,
  refundReason: null,
  disputedAt: null,
  disputeReason: null,
  parentPaymentId: null,
  origin: process.env.NEXT_PUBLIC_SITE_URL ?? null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockExecute.mockReturnValue(Effect.succeed(undefined));
  mockQuery.mockReturnValue(Effect.succeed([]));
});

describe('savePayment', () => {
  it('executes an INSERT INTO payments', async () => {
    await runEffect(savePayment(BASE_PAYMENT));
    expect(mockExecute).toHaveBeenCalledOnce();
    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT OR IGNORE INTO payments');
  });

  it('passes id as first argument', async () => {
    await runEffect(savePayment(BASE_PAYMENT));
    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[0]).toBe('pi_test');
  });

  it('passes email, amount, currency and status in correct positions', async () => {
    await runEffect(savePayment(BASE_PAYMENT));
    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[4]).toBe('user@example.com');
    expect(args[5]).toBe(1000);
    expect(args[6]).toBe('eur');
    expect(args[7]).toBe('succeeded');
  });

  it('passes null for optional fields when they are null', async () => {
    await runEffect(savePayment({ ...BASE_PAYMENT, customerId: null, chargeId: null, promoCode: null }));
    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[2]).toBeNull();
    expect(args[3]).toBeNull();
  });

  it('propagates DatabaseError when execute fails', async () => {
    mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: 'insert failed' })));
    const error = await runFlipEffect(savePayment(BASE_PAYMENT));
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('updatePaymentStatus', () => {
  it('executes an UPDATE payments SET status', async () => {
    await runEffect(updatePaymentStatus('pi_test', 'succeeded'));
    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE payments');
    expect(sql).toContain('SET status');
  });

  it('passes status and paymentIntentId as arguments', async () => {
    await runEffect(updatePaymentStatus('pi_test', 'succeeded'));
    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[0]).toBe('succeeded');
    expect(args[2]).toBe('pi_test');
  });

  it('propagates DatabaseError when execute fails', async () => {
    mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: 'update failed' })));
    const error = await runFlipEffect(updatePaymentStatus('pi_test', 'succeeded'));
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('updatePaymentCharge', () => {
  const chargeData: PaymentChargeData = {
    paymentIntentId: 'pi_test',
    chargeId: 'ch_abc',
    receiptUrl: 'https://receipt.url',
    paymentMethodType: 'card',
    country: 'ES',
    customerName: 'Test User',
    postalCode: '08001',
    city: 'Barcelona',
    state: null,
    paymentBrand: 'visa',
    paymentLast4: '4242',
    feeAmount: 30,
    netAmount: 970,
  };

  it('executes an UPDATE payments SET stripe_charge_id', async () => {
    await runEffect(updatePaymentCharge(chargeData));
    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE payments');
    expect(sql).toContain('stripe_charge_id');
  });

  it('passes chargeId and paymentIntentId as first and last arguments', async () => {
    await runEffect(updatePaymentCharge(chargeData));
    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[0]).toBe('ch_abc');
    expect(args[args.length - 1]).toBe('pi_test');
  });

  it('propagates DatabaseError when execute fails', async () => {
    mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: 'update failed' })));
    const error = await runFlipEffect(updatePaymentCharge(chargeData));
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('getPaymentById', () => {
  it('queries payments by id', async () => {
    await runEffect(getPaymentById('pi_test'));
    const [sql, args] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WHERE id = ?');
    expect(args[0]).toBe('pi_test');
  });

  it('returns the first row when found', async () => {
    mockQuery.mockReturnValue(Effect.succeed([BASE_PAYMENT]));
    const result = await runEffect(getPaymentById('pi_test'));
    expect(result).toEqual(BASE_PAYMENT);
  });

  it('returns undefined when no rows found', async () => {
    mockQuery.mockReturnValue(Effect.succeed([]));
    const result = await runEffect(getPaymentById('pi_unknown'));
    expect(result).toBeUndefined();
  });

  it('propagates DatabaseError when query fails', async () => {
    mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: 'query failed' })));
    const error = await runFlipEffect(getPaymentById('pi_test'));
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('getPaymentByEmail', () => {
  it('queries payments by email filtering succeeded status', async () => {
    await runEffect(getPaymentByEmail('user@example.com'));
    const [sql, args] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'succeeded'");
    expect(args[0]).toBe('user@example.com');
  });

  it('returns the first row when found', async () => {
    mockQuery.mockReturnValue(Effect.succeed([BASE_PAYMENT]));
    const result = await runEffect(getPaymentByEmail('user@example.com'));
    expect(result).toEqual(BASE_PAYMENT);
  });

  it('returns undefined when no rows found', async () => {
    const result = await runEffect(getPaymentByEmail('unknown@example.com'));
    expect(result).toBeUndefined();
  });

  it('propagates DatabaseError when query fails', async () => {
    mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: 'query failed' })));
    const error = await runFlipEffect(getPaymentByEmail('user@example.com'));
    expect(error).toBeInstanceOf(DatabaseError);
  });
});
