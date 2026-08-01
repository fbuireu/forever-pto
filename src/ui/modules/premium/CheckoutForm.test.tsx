import deMessages from '@i18n/messages/de.json';
import enMessages from '@i18n/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const uiState = { getCurrencyFromLocale: vi.fn(), currency: 'EUR' };
const premiumState = { setPremiumStatus: vi.fn() };

vi.mock('@application/stores/ui', () => ({
  useUIStore: (selector: (state: typeof uiState) => unknown) => selector(uiState),
}));
vi.mock('@application/stores/premium', () => ({
  usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock('@infrastructure/clients/logging/better-stack/tracking', () => ({ track: vi.fn() }));
vi.mock('@ui/adapters/payments/checkout', () => ({ confirmPayment: vi.fn() }));
vi.mock('@stripe/react-stripe-js', () => ({
  ExpressCheckoutElement: () => null,
  PaymentElement: () => null,
  useElements: () => ({}),
  useStripe: () => ({}),
}));
vi.mock('boneyard-js/react', () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@ui/modules/core/animate/icons/Icon', () => ({
  AnimateIcon: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@ui/modules/core/animate/icons/ChevronLeft', () => ({ ChevronLeft: () => null }));
vi.mock('@ui/modules/core/primitives/Button', () => ({
  Button: ({ children }: { children: ReactNode }) => <button type='button'>{children}</button>,
}));
vi.mock('./ExpressCheckoutFixture', () => ({ ExpressCheckoutFixture: () => null }));

import { track } from '@infrastructure/clients/logging/better-stack/tracking';
import { confirmPayment } from '@ui/adapters/payments/checkout';
import { CheckoutForm } from './CheckoutForm';

const NON_BREAKING_SPACES = /[  ]/g;

const DISCOUNT = { originalAmount: 15, finalAmount: 12.5, code: 'LAUNCH50', percentOff: 50 };

const renderForm = (locale: string, messages: object, amount: number, discountInfo: unknown = null) => {
  const { container } = render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CheckoutForm
        amount={amount}
        email='donor@example.com'
        discountInfo={discountInfo as never}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    </NextIntlClientProvider>
  );
  return (container.textContent ?? '').replace(NON_BREAKING_SPACES, ' ');
};

describe('CheckoutForm amount rendering', () => {
  it('renders the German amount with comma decimals and a trailing symbol', () => {
    expect(renderForm('de', deMessages, 12.5)).toContain('12,50 €');
  });

  it('renders the English amount with a leading symbol and dot decimals', () => {
    expect(renderForm('en', enMessages, 12.5)).toContain('€12.50');
  });

  it('formats the amount on the pay button too', () => {
    const text = renderForm('de', deMessages, 12.5);
    expect(text).toContain(`${deMessages.checkout.pay} 12,50 €`);
  });

  it('formats the promo saving instead of prefixing a hardcoded euro sign', () => {
    const text = renderForm('de', deMessages, 12.5, DISCOUNT);
    expect(text).toContain('Sie haben 2,50 € gespart!');
  });
});

const INTERNAL_ERROR_MESSAGE = 'Something went wrong on our side. Please try again later.';
const messagesWithErrors = {
  ...enMessages,
  checkout: { ...enMessages.checkout, errors: { internal_error: INTERNAL_ERROR_MESSAGE } },
};

const submitPayment = async (messages: object) => {
  const { container } = render(
    <NextIntlClientProvider locale='en' messages={messages}>
      <CheckoutForm
        amount={12.5}
        email='donor@example.com'
        discountInfo={null}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    </NextIntlClientProvider>
  );
  const form = container.querySelector('form');
  if (!form) throw new Error('checkout form did not render');
  fireEvent.submit(form);
};

describe('CheckoutForm failure reporting', () => {
  it('renders the translated message for a machine code instead of the code itself', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({ success: false, error: 'internal_error' });

    await submitPayment(messagesWithErrors);

    await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
    expect(screen.queryByText('internal_error')).toBeNull();
  });

  it('falls back to the generic message when the code has no key of its own', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({ success: false, error: 'webhook_processing_failed' });

    await submitPayment(messagesWithErrors);

    await waitFor(() => expect(screen.getByText(enMessages.checkout.paymentFailed)).toBeTruthy());
  });

  it('keeps the prose Stripe already localised', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({ success: false, error: 'Your card was declined.' });

    await submitPayment(messagesWithErrors);

    await waitFor(() => expect(screen.getByText('Your card was declined.')).toBeTruthy());
  });

  it('sends the machine code to analytics, never the translated message', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({ success: false, error: 'internal_error' });

    await submitPayment(messagesWithErrors);

    await waitFor(() => expect(vi.mocked(track)).toHaveBeenCalledWith('payment_failed', { error: 'internal_error' }));
  });

  it('reports a stable code to analytics when the failure carries none', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({ success: false, error: '' });

    await submitPayment(messagesWithErrors);

    await waitFor(() => expect(vi.mocked(track)).toHaveBeenCalledWith('payment_failed', { error: 'unknown_error' }));
  });
});
