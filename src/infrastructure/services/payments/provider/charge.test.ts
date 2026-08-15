import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PaymentError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { retrieveCharge } = await import('./charge');

const mockChargesRetrieve = vi.fn();

const MockStripeLayer = Layer.succeed(StripeServerService, {
  paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
  charges: { retrieve: mockChargesRetrieve },
  promotionCodes: { list: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
});

const run = (id: string) => Effect.runPromise(retrieveCharge(id).pipe(Effect.provide(MockStripeLayer)));

const STRIPE_CHARGE = {
  id: 'ch_abc',
  receipt_url: 'https://receipt.stripe.com/ch_abc',
  billing_details: {
    name: 'Test User',
    address: { country: 'ES', postal_code: '08001', city: 'Barcelona', state: null },
  },
  payment_method_details: {
    type: 'card',
    card: { brand: 'visa', last4: '4242' },
  },
  application_fee_amount: null,
  amount: 1000,
  balance_transaction: { id: 'txn_abc', fee: 54, net: 946 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockChargesRetrieve.mockReturnValue(Effect.succeed(STRIPE_CHARGE));
});

describe('retrieveCharge', () => {
  it('expands the balance transaction, without which Stripe never returns the fee', async () => {
    await run('ch_abc');
    expect(mockChargesRetrieve).toHaveBeenCalledWith('ch_abc', { expand: ['balance_transaction'] });
  });

  it('returns ChargeData with all mapped fields', async () => {
    const result = await run('ch_abc');
    expect(result).toEqual({
      id: 'ch_abc',
      receiptUrl: 'https://receipt.stripe.com/ch_abc',
      paymentMethodType: 'card',
      country: 'ES',
      customerName: 'Test User',
      postalCode: '08001',
      city: 'Barcelona',
      state: null,
      paymentBrand: 'visa',
      paymentLast4: '4242',
      feeAmount: 54,
      netAmount: 946,
    });
  });

  it('reads fee and net from the balance transaction, not the amount', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, amount: 2000, balance_transaction: { id: 'txn_abc', fee: 79, net: 1921 } })
    );
    const result = await run('ch_abc');
    expect(result.feeAmount).toBe(79);
    expect(result.netAmount).toBe(1921);
  });

  it('reports no fee or net while the charge has not settled', async () => {
    mockChargesRetrieve.mockReturnValue(Effect.succeed({ ...STRIPE_CHARGE, balance_transaction: null }));
    const result = await run('ch_abc');
    expect(result.feeAmount).toBeNull();
    expect(result.netAmount).toBeNull();
  });

  it('reports no fee or net when the balance transaction is not expanded', async () => {
    mockChargesRetrieve.mockReturnValue(Effect.succeed({ ...STRIPE_CHARGE, balance_transaction: 'txn_abc' }));
    const result = await run('ch_abc');
    expect(result.feeAmount).toBeNull();
    expect(result.netAmount).toBeNull();
  });

  it('never substitutes the Connect application fee for the Stripe processing fee', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, application_fee_amount: 30, balance_transaction: null })
    );
    const result = await run('ch_abc');
    expect(result.feeAmount).toBeNull();
    expect(result.netAmount).toBeNull();
  });

  it('sets billing fields to null when billing_details is missing', async () => {
    mockChargesRetrieve.mockReturnValue(Effect.succeed({ ...STRIPE_CHARGE, billing_details: null }));
    const result = await run('ch_abc');
    expect(result.country).toBeNull();
    expect(result.customerName).toBeNull();
    expect(result.postalCode).toBeNull();
    expect(result.city).toBeNull();
  });

  it('sets card fields to null when payment_method_details is missing', async () => {
    mockChargesRetrieve.mockReturnValue(Effect.succeed({ ...STRIPE_CHARGE, payment_method_details: null }));
    const result = await run('ch_abc');
    expect(result.paymentMethodType).toBeNull();
    expect(result.paymentBrand).toBeNull();
    expect(result.paymentLast4).toBeNull();
  });

  it('propagates PaymentError when Stripe fails', async () => {
    mockChargesRetrieve.mockReturnValue(Effect.fail(new PaymentError({ message: 'charge not found' })));
    const error = await Effect.runPromise(
      retrieveCharge('ch_missing').pipe(Effect.provide(MockStripeLayer), Effect.flip)
    );
    expect(error).toBeInstanceOf(PaymentError);
  });
});
