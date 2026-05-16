import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import { paymentConfirmationDTO, paymentDataDTO } from './dto';

const CREATED_UNIX = 1_700_000_000;

const makeIntent = (overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent =>
  ({
    id: 'pi_test_123',
    status: 'succeeded',
    amount: 999,
    currency: 'eur',
    created: CREATED_UNIX,
    customer: 'cus_test_456',
    latest_charge: 'ch_test_789',
    payment_method_types: ['card'],
    description: 'Test payment',
    metadata: {},
    ...overrides,
  }) as unknown as Stripe.PaymentIntent;

const DATA_PARAMS = {
  email: 'user@example.com',
  promoCode: null,
  userAgent: 'Mozilla/5.0',
  ipAddress: '127.0.0.1',
};

describe('paymentConfirmationDTO', () => {
  it('converts amount from cents to major currency units', () => {
    const result = paymentConfirmationDTO.create({ raw: makeIntent({ amount: 1099 }) });
    expect(result.amount).toBeCloseTo(10.99);
  });

  it('uppercases the currency', () => {
    const result = paymentConfirmationDTO.create({ raw: makeIntent({ currency: 'eur' }) });
    expect(result.currency).toBe('EUR');
  });

  it('preserves id and status unchanged', () => {
    const result = paymentConfirmationDTO.create({ raw: makeIntent() });
    expect(result.id).toBe('pi_test_123');
    expect(result.status).toBe('succeeded');
  });

  it('handles an already uppercase currency without double-uppercasing', () => {
    const result = paymentConfirmationDTO.create({ raw: makeIntent({ currency: 'USD' }) });
    expect(result.currency).toBe('USD');
  });
});

describe('paymentDataDTO', () => {
  it('throws when params are missing', () => {
    expect(() => paymentDataDTO.create({ raw: makeIntent() })).toThrow('params required');
  });

  it('preserves amount in cents as-is (no division)', () => {
    const result = paymentDataDTO.create({ raw: makeIntent({ amount: 999 }), params: DATA_PARAMS });
    expect(result.amount).toBe(999);
  });

  it('converts Unix created timestamp to a Date', () => {
    const result = paymentDataDTO.create({ raw: makeIntent(), params: DATA_PARAMS });
    expect(result.stripeCreatedAt).toBeInstanceOf(Date);
    expect(result.stripeCreatedAt.getTime()).toBe(CREATED_UNIX * 1000);
  });

  it('extracts customerId from a string customer', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ customer: 'cus_test_456' }),
      params: DATA_PARAMS,
    });
    expect(result.customerId).toBe('cus_test_456');
  });

  it('extracts customerId from a Customer object', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ customer: { id: 'cus_obj_789', object: 'customer' } as Stripe.Customer }),
      params: DATA_PARAMS,
    });
    expect(result.customerId).toBe('cus_obj_789');
  });

  it('sets customerId to null when customer is null', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ customer: null }),
      params: DATA_PARAMS,
    });
    expect(result.customerId).toBeNull();
  });

  it('extracts chargeId from a string charge', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ latest_charge: 'ch_test_789' }),
      params: DATA_PARAMS,
    });
    expect(result.chargeId).toBe('ch_test_789');
  });

  it('sets chargeId to null when latest_charge is null', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ latest_charge: null }),
      params: DATA_PARAMS,
    });
    expect(result.chargeId).toBeNull();
  });

  it('maps all params fields correctly', () => {
    const params = { email: 'a@b.com', promoCode: 'PROMO10', userAgent: 'UA', ipAddress: '1.2.3.4' };
    const result = paymentDataDTO.create({ raw: makeIntent(), params });
    expect(result.email).toBe('a@b.com');
    expect(result.promoCode).toBe('PROMO10');
    expect(result.userAgent).toBe('UA');
    expect(result.ipAddress).toBe('1.2.3.4');
  });

  it('initialises nullable DB fields to null', () => {
    const result = paymentDataDTO.create({ raw: makeIntent(), params: DATA_PARAMS });
    const nullableFields = [
      'country',
      'customerName',
      'postalCode',
      'city',
      'state',
      'paymentBrand',
      'paymentLast4',
      'feeAmount',
      'netAmount',
      'refundedAt',
      'refundReason',
      'disputedAt',
      'disputeReason',
      'parentPaymentId',
      'origin',
    ] as const;

    for (const field of nullableFields) {
      expect(result[field], field).toBeNull();
    }
  });

  it('uses the first payment_method_type when available', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ payment_method_types: ['card', 'sepa_debit'] }),
      params: DATA_PARAMS,
    });
    expect(result.paymentMethodType).toBe('card');
  });

  it('sets paymentMethodType to null when array is empty', () => {
    const result = paymentDataDTO.create({
      raw: makeIntent({ payment_method_types: [] }),
      params: DATA_PARAMS,
    });
    expect(result.paymentMethodType).toBeNull();
  });
});
