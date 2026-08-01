import enMessages from '@i18n/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

const premiumState = { setEmail: vi.fn(), userEmail: null };
const sendContactEmailAction = vi.fn();

vi.mock('@application/stores/premium', () => ({
  usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock('@infrastructure/clients/logging/better-stack/tracking', () => ({ track: vi.fn() }));
vi.mock('@infrastructure/actions/contact', () => ({ sendContactEmailAction }));

import { ContactModal } from './ContactModal';

const INTERNAL_ERROR_MESSAGE = 'Something went wrong on our side. Please try again later.';
const messagesWithErrors = {
  ...enMessages,
  contact: { ...enMessages.contact, errors: { internal_error: INTERNAL_ERROR_MESSAGE } },
};

const submitMessage = async (messages: object) => {
  render(
    <NextIntlClientProvider locale='en' messages={messages}>
      <ContactModal open onClose={vi.fn()} />
    </NextIntlClientProvider>
  );

  const fill = (placeholder: string, value: string) =>
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

  fill(enMessages.contact.namePlaceholder, 'Ada Lovelace');
  fill(enMessages.contact.emailPlaceholder, 'ada@example.com');
  fill(enMessages.contact.subjectPlaceholder, 'A question about Bridges');
  fill(enMessages.contact.messagePlaceholder, 'How does the planner pick which Bridges to build?');

  fireEvent.click(screen.getByText(enMessages.contact.sendMessage));
};

describe('ContactModal failure reporting', () => {
  it('renders the translated message for a machine code instead of the code itself', async () => {
    sendContactEmailAction.mockResolvedValue({ success: false, error: 'internal_error' });

    await submitMessage(messagesWithErrors);

    await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
    expect(screen.queryByText('internal_error')).toBeNull();
  });

  it('falls back to the generic message when the code has no key of its own', async () => {
    sendContactEmailAction.mockResolvedValue({ success: false, error: 'name_too_long' });

    await submitMessage(messagesWithErrors);

    await waitFor(() => expect(screen.getByText(enMessages.contact.failedToSend)).toBeTruthy());
  });
});
