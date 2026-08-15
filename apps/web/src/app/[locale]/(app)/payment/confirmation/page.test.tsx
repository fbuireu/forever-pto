import type { PaymentConfirmationDTO } from '@application/dto/payment/types';
import { DE, EN } from '@infrastructure/i18n/locales';
import { ACTIVATION_FAILED } from '@infrastructure/services/premium/activation';
import { render } from '@testing-library/react';
import { Effect, Layer } from 'effect';
import { createFormatter } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const NON_BREAKING_SPACES = /[  ]/g;

const PAYMENT_INTENT_ID = 'pi_test_123';

const mockRedirect = vi.fn();
const mockLogger = { warn: vi.fn(), logError: vi.fn() };
const mockGetTranslations = vi.fn();
const mockGetFormatter = vi.fn();
const mockConfirmation = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue(mockLogger),
}));

vi.mock('@infrastructure/layers', () => ({ ApplicationLayer: Layer.empty }));

vi.mock('@infrastructure/services/payments/confirmation', () => ({
  confirmation: mockConfirmation,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
  getFormatter: mockGetFormatter,
}));

vi.mock('@application/i18n/navigation', () => ({
  Link: vi.fn().mockReturnValue(null),
}));

vi.mock('@ui/modules/core/primitives/Button', () => ({
  Button: vi.fn().mockReturnValue(null),
}));

vi.mock('@ui/modules/core/primitives/Card', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Card: passthrough,
    CardContent: passthrough,
    CardDescription: passthrough,
    CardHeader: passthrough,
    CardTitle: passthrough,
  };
});

vi.mock('@ui/modules/premium/PremiumSessionSync', () => ({
  PremiumSessionSync: () => null,
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

const renderErrorPage = async () => {
  const element = await PaymentSuccessPage(makeSuccessParams());
  const resolved = await (element.type as (props: unknown) => Promise<never>)(element.props);
  return render(resolved);
};

const makeFailedActivationParams = () => ({
  searchParams: Promise.resolve({ payment_intent: PAYMENT_INTENT_ID, activation: ACTIVATION_FAILED }),
  params: Promise.resolve({ locale: EN as never }),
});

const SUCCESS_CONFIRMATION: PaymentConfirmationDTO = {
  id: PAYMENT_INTENT_ID,
  status: 'succeeded',
  amount: 10,
  currency: 'USD',
};

describe('payment/confirmation page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTranslations.mockResolvedValue(vi.fn((key: string) => `t:${key}`));
    mockGetFormatter.mockResolvedValue(createFormatter({ locale: EN }));
    mockConfirmation.mockReturnValue(Effect.succeed(SUCCESS_CONFIRMATION));
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
    it('returns PaymentError component when confirmation returns null', async () => {
      mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(typeof element.type).toBe('function');
      expect((element.type as { name?: string }).name).toBe('PaymentError');
    });

    it('returns PaymentError component when status is not succeeded', async () => {
      mockConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'processing', amount: 10, currency: 'USD' })
      );
      const element = await PaymentSuccessPage(makeSuccessParams());
      expect(typeof element.type).toBe('function');
      expect((element.type as { name?: string }).name).toBe('PaymentError');
    });

    it('does not claim the payer was spared when Stripe says the payment is still processing', async () => {
      mockConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'processing', amount: 10, currency: 'USD' })
      );
      const { container } = await renderErrorPage();
      expect(container.textContent).toContain('t:unconfirmedTitle');
      expect(container.textContent).not.toContain('t:description');
    });

    it('does not claim the payer was spared when the Stripe read itself failed', async () => {
      mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
      const { container } = await renderErrorPage();
      expect(container.textContent).toContain('t:unconfirmedTitle');
    });

    it('still says the card was untouched when Stripe says the intent was never charged', async () => {
      mockConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'requires_payment_method', amount: 10, currency: 'USD' })
      );
      const { container } = await renderErrorPage();
      expect(container.textContent).toContain('t:description');
      expect(container.textContent).not.toContain('t:unconfirmedTitle');
    });

    it('logs a warning when status is not succeeded', async () => {
      mockConfirmation.mockReturnValueOnce(
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

    it('builds the formatter for the requested locale', async () => {
      await PaymentSuccessPage(makeParams(DE, PAYMENT_INTENT_ID));
      expect(mockGetFormatter).toHaveBeenCalledWith({ locale: DE });
    });

    it('reports Premium as active when the activation route did not flag a failure', async () => {
      const { container } = render(await PaymentSuccessPage(makeSuccessParams()));
      expect(container.textContent).toContain('t:premiumActivated');
      expect(container.textContent).not.toContain('t:premiumActivationFailed');
    });

    it('never claims Premium is active when the activation route says it failed', async () => {
      const { container } = render(await PaymentSuccessPage(makeFailedActivationParams()));
      expect(container.textContent).toContain('t:premiumActivationFailed');
      expect(container.textContent).not.toContain('t:premiumActivated');
    });
  });

  describe('amount formatting', () => {
    const renderAmount = async (locale: string, currency: string, amount: number) => {
      mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
      mockConfirmation.mockReturnValueOnce(
        Effect.succeed({ id: PAYMENT_INTENT_ID, status: 'succeeded', amount, currency })
      );
      const { container } = render(await PaymentSuccessPage(makeParams(locale, PAYMENT_INTENT_ID)));
      return (container.textContent ?? '').replace(NON_BREAKING_SPACES, ' ');
    };

    it('renders a German amount with comma decimals and a trailing symbol', async () => {
      expect(await renderAmount(DE, 'eur', 12.5)).toContain('12,50 €');
    });

    it('renders an English amount with a leading symbol and dot decimals', async () => {
      expect(await renderAmount(EN, 'usd', 12.5)).toContain('$12.50');
    });

    it('groups thousands in the amount', async () => {
      expect(await renderAmount(EN, 'usd', 1234.5)).toContain('$1,234.50');
    });
  });
});
