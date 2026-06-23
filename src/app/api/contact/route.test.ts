import { ApiError } from '@infrastructure/api/errors';
import { EmailError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockSendContactEmail = vi.hoisted(() =>
  vi.fn<
    (
      data: unknown,
      config: unknown
    ) => Effect.Effect<{ deferred: Effect.Effect<void, never, never> }, ValidationError | EmailError>
  >()
);

vi.mock('@application/use-cases/contact', () => ({
  sendContactEmail: mockSendContactEmail,
}));

vi.mock('@infrastructure/layers', () => ({
  ApplicationLayer: Layer.empty,
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: vi.fn() };
});

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockReturnValue({
    env: {
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
      NEXT_PUBLIC_CONTACT_EMAIL: 'contact@example.com',
    },
  }),
}));

const { POST } = await import('./route');

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/contact', () => {
  it('returns 200 with success on valid submission', async () => {
    mockSendContactEmail.mockReturnValue(Effect.succeed({ deferred: Effect.void }));
    const response = await POST(
      makeRequest({ email: 'test@example.com', name: 'Test', subject: 'Hello', message: 'World' }) as never
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 on ValidationError', async () => {
    mockSendContactEmail.mockReturnValue(Effect.fail(new ValidationError({ message: 'Email is required' })));
    const response = await POST(makeRequest({ name: 'Test' }) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Email is required');
  });

  it('returns 500 on EmailError', async () => {
    mockSendContactEmail.mockReturnValue(Effect.fail(new EmailError({ message: 'SMTP failed' })));
    const response = await POST(makeRequest({ email: 'test@example.com' }) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(ApiError.INTERNAL_ERROR);
  });

  it('returns 500 on unexpected typed error', async () => {
    // A typed error that slips through catchTags falls to catchAll
    mockSendContactEmail.mockReturnValue(
      Effect.fail(new Error('unexpected')) as unknown as Effect.Effect<
        { deferred: Effect.Effect<void, never, never> },
        ValidationError | EmailError
      >
    );
    const response = await POST(makeRequest({}) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(ApiError.INTERNAL_ERROR);
  });
});
