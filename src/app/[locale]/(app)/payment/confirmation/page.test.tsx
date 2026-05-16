import { EN } from '@infrastructure/i18n/locales';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PAYMENT_INTENT_ID = 'pi_test_123';

const mockRedirect = vi.fn();
const mockLogger = { warn: vi.fn(), logError: vi.fn() };
const mockGetTranslations = vi.fn();
const mockGetCurrencySymbol = vi.fn().mockReturnValue('$');
const mockGetPaymentConfirmation = vi.fn(() =>
  Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'succeeded', amount: 10, currency: 'USD' })
);

vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue(mockLogger),
}));

vi.mock('@infrastructure/layers', () => ({ AppLayer: Layer.empty }));

vi.mock('@infrastructure/services/payments/getPaymentConfirmation', () => ({
  getPaymentConfirmation: mockGetPaymentConfirmation,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));

vi.mock('@ui/utils/currencies', () => ({
  getCurrencySymbol: mockGetCurrencySymbol,
}));

vi.mock('@application/i18n/navigation', () => ({
  Link: vi.fn().mockReturnValue(null),
}));

vi.mock('@ui/modules/core/primitives/Button', () => ({
  Button: vi.fn().mockReturnValue(null),
}));

vi.mock('@ui/modules/core/primitives/Card', () => ({
  Card: vi.fn().mockReturnValue(null),
  CardContent: vi.fn().mockReturnValue(null),
  CardDescription: vi.fn().mockReturnValue(null),
  CardHeader: vi.fn().mockReturnValue(null),
  CardTitle: vi.fn().mockReturnValue(null),
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: vi.fn().mockReturnValue(null),
  XCircle: vi.fn().mockReturnValue(null),
}));

const { default: PaymentSuccessPage } = await import('./page');

const makeParams = (locale = EN, paymentIntent?: string) => ({
  searchParams: Promise.resolve(paymentIntent ? { payment_intent: paymentIntent } : {}),
  params: Promise.resolve({ locale: locale as never }),
});

const makeSuccessParams = () => makeParams(EN, PAYMENT_INTENT_ID);

describe('payment/confirmation page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTranslations.mockResolvedValue(vi.fn((key: string) => `t:${key}`));
    mockGetPaymentConfirmation.mockReturnValue(
      Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'succeeded', amount: 10, currency: 'USD' })
    );
  });

  describe('redirect', () => {
    it('redirects when no payment_intent', async () => {
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });
      await expect(PaymentSuccessPage(makeParams(EN))).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith(`/${EN}`);
    });
  });

  describe('PaymentError state', () => {
    it('returns PaymentError component when getPaymentConfirmation returns null', async () => {
      mockGetPaymentConfirmation.mockReturnValueOnce(Effect.succeed(null));
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(typeof element.type).toBe('function');
      expect((element.type as { name?: string }).name).toBe('PaymentError');
    });

    it('returns PaymentError component when status is not succeeded', async () => {
      mockGetPaymentConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'processing', amount: 10, currency: 'USD' })
      );
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(typeof element.type).toBe('function');
      expect((element.type as { name?: string }).name).toBe('PaymentError');
    });

    it('logs a warning when status is not succeeded', async () => {
      mockGetPaymentConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'requires_payment_method', amount: 10, currency: 'USD' })
      );
      await PaymentSuccessPage(makeSuccessParams());
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('success state', () => {
    it('returns a div wrapper on success', async () => {
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(element.type).toBe('div');
    });

    it('success wrapper has m-auto class', async () => {
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(element.props.className).toContain('m-auto');
    });

    it('calls getTranslations with paymentConfirmation.success namespace', async () => {
      await PaymentSuccessPage(makeSuccessParams());
      expect(mockGetTranslations).toHaveBeenCalledWith('paymentConfirmation.success');
    });

    it('calls getCurrencySymbol with locale and currency', async () => {
      await PaymentSuccessPage(makeSuccessParams());
      expect(mockGetCurrencySymbol).toHaveBeenCalledWith(expect.objectContaining({ locale: EN, currency: 'USD' }));
    });
  });
});
