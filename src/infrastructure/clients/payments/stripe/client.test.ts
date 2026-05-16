import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLoadStripe = vi.hoisted(() => vi.fn());

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: mockLoadStripe,
}));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: vi.fn() }),
}));

const mockConfirmPayment = vi.fn();
const mockConfirmCardPayment = vi.fn();
const mockStripe = {
  confirmPayment: mockConfirmPayment,
  confirmCardPayment: mockConfirmCardPayment,
};

const { getStripeClientInstance } = await import('./client');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('location', { href: 'http://localhost/' });
  mockLoadStripe.mockResolvedValue(mockStripe);
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getStripeClientInstance', () => {
  it('throws when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '');
    expect(() => getStripeClientInstance()).toThrow('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  });

  it('returns the same instance on repeated calls', () => {
    const a = getStripeClientInstance();
    const b = getStripeClientInstance();
    expect(a).toBe(b);
  });
});

describe('StripeClient.confirmPayment', () => {
  it('returns success with paymentIntentId when status is succeeded', async () => {
    mockConfirmPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded', id: 'pi_abc' },
    });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.paymentIntentId).toBe('pi_abc');
  });

  it('returns failure when result contains a Stripe error', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: { message: 'Your card was declined.' },
    });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Your card was declined.');
  });

  it('returns failure when paymentIntent status is not succeeded', async () => {
    mockConfirmPayment.mockResolvedValue({
      paymentIntent: { status: 'processing', id: 'pi_xyz' },
    });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('processing');
  });

  it('returns failure with card_error message when SDK throws a card error', async () => {
    mockConfirmPayment.mockRejectedValue({ type: 'card_error', message: 'Card declined.' });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Card declined.');
  });

  it('returns failure with invalid_request message when SDK throws an invalid_request error', async () => {
    mockConfirmPayment.mockRejectedValue({ type: 'invalid_request_error', message: 'Invalid params.' });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Payment request is invalid. Please try again.');
  });
});

describe('StripeClient.confirmCardPayment', () => {
  it('returns success when paymentIntent status is succeeded', async () => {
    mockConfirmCardPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded', id: 'pi_card' },
    });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(true);
    if (result.success) expect(result.paymentIntentId).toBe('pi_card');
  });

  it('returns failure when result contains a Stripe error', async () => {
    mockConfirmCardPayment.mockResolvedValue({
      error: { message: 'Insufficient funds.' },
    });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Insufficient funds.');
  });
});
