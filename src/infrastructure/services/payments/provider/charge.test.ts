import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PaymentError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { retrieveCharge } = await import('./charge');

const mockChargesRetrieve = vi.fn();

const MockStripeLayer = Layer.succeed(StripeServerService, {
  paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
  charges: { retrieve: mockChargesRetrieve },
  promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
});

const run = (id: string) =>
  Effect.runPromise(retrieveCharge(id).pipe(Effect.provide(MockStripeLayer)));

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
  application_fee_amount: 30,
  amount: 1000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockChargesRetrieve.mockReturnValue(Effect.succeed(STRIPE_CHARGE));
});

describe('retrieveCharge', () => {
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
      feeAmount: 30,
      netAmount: 970,
    });
  });

  it('calculates netAmount as amount minus fee', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, amount: 2000, application_fee_amount: 50 })
    );
    const result = await run('ch_abc');
    expect(result.netAmount).toBe(1950);
  });

  it('sets feeAmount and netAmount to null when application_fee_amount is null', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, application_fee_amount: null })
    );
    const result = await run('ch_abc');
    expect(result.feeAmount).toBeNull();
    expect(result.netAmount).toBe(1000);
  });

  it('sets billing fields to null when billing_details is missing', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, billing_details: null })
    );
    const result = await run('ch_abc');
    expect(result.country).toBeNull();
    expect(result.customerName).toBeNull();
    expect(result.postalCode).toBeNull();
    expect(result.city).toBeNull();
  });

  it('sets card fields to null when payment_method_details is missing', async () => {
    mockChargesRetrieve.mockReturnValue(
      Effect.succeed({ ...STRIPE_CHARGE, payment_method_details: null })
    );
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
