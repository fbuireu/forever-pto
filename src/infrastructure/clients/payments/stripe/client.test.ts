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

  it('returns failure with invalid_request code when SDK throws an invalid_request error', async () => {
    mockConfirmPayment.mockRejectedValue({ type: 'invalid_request_error', message: 'Invalid params.' });
    const result = await getStripeClientInstance().confirmPayment({
      clientSecret: 'pi_secret',
      returnUrl: 'https://example.com/return',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('invalid_request');
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

  it('returns failure when paymentIntent status is not succeeded', async () => {
    mockConfirmCardPayment.mockResolvedValue({ paymentIntent: { status: 'processing', id: 'pi_y' } });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('processing');
  });

  it('returns failure with card_error message when SDK throws a card error', async () => {
    mockConfirmCardPayment.mockRejectedValue({ type: 'card_error', message: 'Card declined.' });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Card declined.');
  });

  it('returns failure with invalid_request code when SDK throws an invalid_request error', async () => {
    mockConfirmCardPayment.mockRejectedValue({ type: 'invalid_request_error' });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('invalid_request');
  });

  it('returns failure with auth_error code when SDK throws an authentication error', async () => {
    mockConfirmCardPayment.mockRejectedValue({ type: 'authentication_error' });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('auth_error');
  });

  it('returns failure with generic error message when SDK throws an unknown error', async () => {
    mockConfirmCardPayment.mockRejectedValue({ message: 'Unexpected error' });
    const result = await getStripeClientInstance().confirmCardPayment('pi_secret');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unexpected error');
  });
});

describe('StripeClient.getStripePromise', () => {
  it('returns a promise that resolves to the Stripe instance', async () => {
    const promise = getStripeClientInstance().getStripePromise();
    await expect(promise).resolves.toBe(mockStripe);
  });
});

describe('StripeClient.isLoaded', () => {
  it('returns true after Stripe has been loaded via confirmPayment', async () => {
    mockConfirmPayment.mockResolvedValue({ paymentIntent: { status: 'succeeded', id: 'pi_x' } });
    await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', returnUrl: 'http://a.com' });
    expect(getStripeClientInstance().isLoaded()).toBe(true);
  });
});

describe('StripeClient.confirmPayment — additional cases', () => {
  it('passes redirect: "always" when alwaysRedirect is true', async () => {
    mockConfirmPayment.mockResolvedValue({ paymentIntent: { status: 'succeeded', id: 'pi_x' } });
    await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', alwaysRedirect: true });
    expect(mockConfirmPayment).toHaveBeenCalledWith(expect.objectContaining({ redirect: 'always' }));
  });

  it('uses location.href as return_url when returnUrl is not provided', async () => {
    mockConfirmPayment.mockResolvedValue({ paymentIntent: { status: 'succeeded', id: 'pi_x' } });
    await getStripeClientInstance().confirmPayment({ clientSecret: 'cs' });
    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({ confirmParams: { return_url: 'http://localhost/' } })
    );
  });

  it('returns failure with auth_error code when SDK throws an authentication error', async () => {
    mockConfirmPayment.mockRejectedValue({ type: 'authentication_error' });
    const result = await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', returnUrl: 'http://a.com' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('auth_error');
  });

  it('returns failure with generic message when SDK throws an unknown error type', async () => {
    mockConfirmPayment.mockRejectedValue({ message: 'Something went wrong' });
    const result = await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', returnUrl: 'http://a.com' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Something went wrong');
  });

  it('returns payment_failed when unknown error has no message', async () => {
    mockConfirmPayment.mockRejectedValue({});
    const result = await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', returnUrl: 'http://a.com' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('payment_failed');
  });

  it('returns failure with unknown status when paymentIntent has no status', async () => {
    mockConfirmPayment.mockResolvedValue({ paymentIntent: {} });
    const result = await getStripeClientInstance().confirmPayment({ clientSecret: 'cs', returnUrl: 'http://a.com' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('unknown');
  });
});
