import { EmailError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockSendContactEmail = vi.hoisted(() =>
  vi.fn<(data: unknown, config: unknown) => Effect.Effect<void, ValidationError | EmailError>>()
);

vi.mock('@application/use-cases/contact', () => ({
  sendContactEmail: mockSendContactEmail,
}));

vi.mock('@infrastructure/layers', () => ({
  AppLayer: Layer.empty,
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockReturnValue({
    env: {
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
      NEXT_PUBLIC_CONTACT_EMAIL: 'contact@example.com',
    },
  }),
}));

const { sendContactEmailAction } = await import('./contact');

const validData = { name: 'Test', email: 'test@example.com', subject: 'Hello', message: 'World' };

describe('sendContactEmailAction', () => {
  it('returns success:true when email is sent', async () => {
    mockSendContactEmail.mockReturnValue(Effect.succeed(undefined));
    const result = await sendContactEmailAction(validData);
    expect(result.success).toBe(true);
  });

  it('returns success:false with error message on ValidationError', async () => {
    mockSendContactEmail.mockReturnValue(Effect.fail(new ValidationError({ message: 'Email is required' })));
    const result = await sendContactEmailAction(validData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Email is required');
  });

  it('returns success:false with error message on EmailError', async () => {
    mockSendContactEmail.mockReturnValue(Effect.fail(new EmailError({ message: 'SMTP failed' })));
    const result = await sendContactEmailAction(validData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('SMTP failed');
  });

  it('returns success:false with generic message on unexpected error', async () => {
    mockSendContactEmail.mockReturnValue(
      Effect.fail(new Error('boom')) as unknown as Effect.Effect<void, ValidationError | EmailError>
    );
    const result = await sendContactEmailAction(validData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Internal error');
  });

  it('passes env config to sendContactEmail', async () => {
    mockSendContactEmail.mockReturnValue(Effect.succeed(undefined));
    await sendContactEmailAction(validData);
    expect(mockSendContactEmail).toHaveBeenCalledWith(validData, {
      siteUrl: 'https://example.com',
      contactEmail: 'contact@example.com',
    });
  });
});
