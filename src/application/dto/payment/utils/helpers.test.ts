import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import type { DiscountInfo } from '../types';
import { calculateFinalAmount, extractChargeId, extractCustomerId } from './helpers';

const DISCOUNT: DiscountInfo = {
  type: 'percent',
  value: 10,
  originalAmount: 10,
  finalAmount: 9,
  couponId: 'coupon_123',
  couponName: 'PROMO10',
};

describe('calculateFinalAmount', () => {
  it('returns baseAmount when discountInfo is null', () => {
    expect(calculateFinalAmount({ baseAmount: 10, discountInfo: null })).toBe(10);
  });

  it('returns finalAmount from discountInfo when present', () => {
    expect(calculateFinalAmount({ baseAmount: 10, discountInfo: DISCOUNT })).toBe(9);
  });

  it('returns zero baseAmount correctly', () => {
    expect(calculateFinalAmount({ baseAmount: 0, discountInfo: null })).toBe(0);
  });
});

describe('extractCustomerId', () => {
  it('returns the string as-is when customer is already a string', () => {
    expect(extractCustomerId('cus_123')).toBe('cus_123');
  });

  it('returns the id when customer is a Customer object', () => {
    const customer = { id: 'cus_456', object: 'customer' } as Stripe.Customer;
    expect(extractCustomerId(customer)).toBe('cus_456');
  });

  it('returns the id when customer is a DeletedCustomer object', () => {
    const customer = { id: 'cus_789', object: 'customer', deleted: true } as Stripe.DeletedCustomer;
    expect(extractCustomerId(customer)).toBe('cus_789');
  });

  it('returns null when customer is null', () => {
    expect(extractCustomerId(null)).toBeNull();
  });
});

describe('extractChargeId', () => {
  it('returns the string as-is when charge is already a string', () => {
    expect(extractChargeId('ch_123')).toBe('ch_123');
  });

  it('returns the id when charge is a Charge object', () => {
    const charge = { id: 'ch_456', object: 'charge' } as Stripe.Charge;
    expect(extractChargeId(charge)).toBe('ch_456');
  });

  it('returns null when charge is null', () => {
    expect(extractChargeId(null)).toBeNull();
  });
});
