import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PaymentError, PromoCodeError, PromoCodeErrors } from '@infrastructure/errors';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreatePaymentAction = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());
const mockLoggerWarn = vi.hoisted(() => vi.fn());

vi.mock('@infrastructure/actions/payment', () => ({ createPaymentAction: mockCreatePaymentAction }));
vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn(() => ({ logError: mockLogError, error: mockLoggerError, warn: mockLoggerWarn })),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { initializePayment, confirmPayment, ConfirmPaymentOutcome } = await import('./checkout');

const mockStripe = { confirmPayment: vi.fn() } as unknown as Stripe;
const mockElements = { submit: vi.fn() } as unknown as StripeElements;

const BASE_CONFIRM_PARAMS = {
  stripe: mockStripe,
  elements: mockElements,
  email: 'user@example.com',
  returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/en/payment/confirmation`,
};

describe('logging imports', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/ui/adapters/payments/checkout.ts'), 'utf8');

  it('reaches the BetterStack client through the shared client-log helper', () => {
    expect(source).toMatch(/from '@application\/shared\/utils\/clientLog'/);
  });

  it('has no value-level static import of the BetterStack client', () => {
    expect(source).not.toMatch(/^import (?!type )[^\n]*better-stack\/client/m);
  });
});

describe('initializePayment', () => {
  beforeEach(() => {
    mockCreatePaymentAction.mockReset();
  });

  it('returns clientSecret and discountInfo on success', async () => {
    const discountInfo = {
      type: 'percent' as const,
      value: 10,
      originalAmount: 100,
      finalAmount: 90,
      couponId: 'c1',
      couponName: 'SAVE10',
    };
    mockCreatePaymentAction.mockResolvedValue({ success: true, clientSecret: 'client-secret-123', discountInfo });

    const result = await initializePayment({ amount: 100, email: 'user@example.com' });

    expect(result.clientSecret).toBe('client-secret-123');
    expect(result.discountInfo).toEqual(discountInfo);
  });

  it('returns null discountInfo when not provided', async () => {
    mockCreatePaymentAction.mockResolvedValue({ success: true, clientSecret: 'client-secret-123' });

    const result = await initializePayment({ amount: 100, email: 'user@example.com' });

    expect(result.discountInfo).toBeNull();
  });

  it('throws PromoCodeError when isPromoCodeError is true', async () => {
    mockCreatePaymentAction.mockResolvedValue({
      success: false,
      isPromoCodeError: true,
      error: PromoCodeErrors.COUPON_EXPIRED,
    });

    await expect(
      initializePayment({ amount: 100, email: 'user@example.com', promoCode: 'BAD' })
    ).rejects.toBeInstanceOf(PromoCodeError);
  });

  it('carries the promo code error code', async () => {
    mockCreatePaymentAction.mockResolvedValue({
      success: false,
      isPromoCodeError: true,
      error: PromoCodeErrors.USAGE_LIMIT_REACHED,
    });

    const thrown = await initializePayment({ amount: 100, email: 'user@example.com', promoCode: 'MAXED' }).catch(
      (e) => e
    );

    expect(thrown).toBeInstanceOf(PromoCodeError);
    expect(thrown.code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
  });

  it('throws PaymentError on generic failure', async () => {
    mockCreatePaymentAction.mockResolvedValue({ success: false, error: 'card declined' });

    await expect(initializePayment({ amount: 100, email: 'user@example.com' })).rejects.toBeInstanceOf(PaymentError);
  });

  it('uses default message when error is undefined', async () => {
    mockCreatePaymentAction.mockResolvedValue({ success: false });

    const thrown = await initializePayment({ amount: 100, email: 'user@example.com' }).catch((e) => e);

    expect(thrown).toBeInstanceOf(PaymentError);
    expect(thrown.message).toBe('Payment initialization failed');
  });
});

describe('confirmPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when elements.submit returns an error', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({ error: { message: 'card incomplete' } });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result).toEqual({ outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: 'card incomplete' });
  });

  it('returns failure when stripe.confirmPayment returns an error', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { message: 'declined by bank' },
    });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result).toEqual({ outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: 'declined by bank' });
  });

  it('does not claim a charge happened when Stripe declined before taking the money', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { message: 'declined by bank' },
    });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result.outcome).not.toBe(ConfirmPaymentOutcome.FAILED_AFTER_CHARGE);
  });

  it('marks the failure as post-charge when the activation request itself throws', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: 'pi_123' } });
    mockFetch.mockRejectedValue(new Error('network down'));

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result.outcome).toBe(ConfirmPaymentOutcome.FAILED_AFTER_CHARGE);
  });

  it('marks the failure as post-charge when the activation response body cannot be read', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: 'pi_123' } });
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error('bad json')) });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result.outcome).toBe(ConfirmPaymentOutcome.FAILED_AFTER_CHARGE);
  });

  it('does not claim a charge on the redirect hand-off, where the issuer has not answered yet', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result).toEqual({ outcome: ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER });
  });

  it('returns failure and logs when session response is not ok', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: 'pi_123' } });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'session activation failed' }),
    });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result).toEqual({ outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: 'session activation failed' });
    await vi.waitFor(() => expect(mockLoggerError).toHaveBeenCalled());
  });

  it('returns success with sessionData on the happy path', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: 'pi_123' } });
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ premiumKey: 'pk_abc', email: 'user@example.com' }),
    });

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result).toEqual({
      outcome: ConfirmPaymentOutcome.SUCCEEDED,
      sessionData: { premiumKey: 'pk_abc', email: 'user@example.com' },
    });
  });

  it('returns failure without calling check-session when Stripe handed off to a redirect', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result.outcome).toBe(ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER);
    expect(mockFetch).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(mockLoggerWarn).toHaveBeenCalled());
  });

  it('returns failure via catchAll when an unexpected error is thrown', async () => {
    (mockElements.submit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network timeout'));

    const result = await confirmPayment(BASE_CONFIRM_PARAMS);

    expect(result.outcome).toBe(ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE);
    await vi.waitFor(() => expect(mockLogError).toHaveBeenCalled());
  });
});
