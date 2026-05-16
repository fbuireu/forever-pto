import { ApiError } from '@infrastructure/api/errors';
import { WebhookError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockConstructEvent = vi.hoisted(() =>
  vi.fn<(payload: string, sig: string) => Effect.Effect<{ type: string }, WebhookError>>()
);
const mockProcessWebhookEvent = vi.hoisted(() => vi.fn<(event: unknown) => Effect.Effect<void, WebhookError>>());
const mockHeadersGet = vi.hoisted(() => vi.fn<(name: string) => string | null>());

vi.mock('@application/use-cases/webhook', () => ({
  processWebhookEvent: mockProcessWebhookEvent,
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}));

vi.mock('@infrastructure/layers', async () => {
  const { Layer } = await import('effect');
  const { StripeServerService } = await import('@infrastructure/clients/payments/stripe/serverService');
  return {
    ApplicationLayer: Layer.succeed(StripeServerService, {
      paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
      charges: { retrieve: vi.fn() },
      promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
      webhooks: { constructEvent: mockConstructEvent as never },
    }),
  };
});

const { POST } = await import('./route');

function makeRequest(body: string, headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  });
}

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    mockHeadersGet.mockReturnValue(null);
    const response = await POST(makeRequest('{}') as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(ApiError.MISSING_SIGNATURE);
  });

  it('returns 200 with received:true on successful webhook', async () => {
    mockHeadersGet.mockImplementation((name) => (name === 'stripe-signature' ? 't=123,v1=abc' : null));
    mockConstructEvent.mockReturnValue(Effect.succeed({ type: 'payment_intent.succeeded' }));
    mockProcessWebhookEvent.mockReturnValue(Effect.succeed(undefined));
    const response = await POST(makeRequest(JSON.stringify({ type: 'payment_intent.succeeded' })) as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
  });

  it('returns 400 on signature verification failure', async () => {
    mockHeadersGet.mockImplementation((name) => (name === 'stripe-signature' ? 'bad-sig' : null));
    mockConstructEvent.mockReturnValue(
      Effect.fail(new WebhookError({ message: 'Signature mismatch', isSignatureError: true }))
    );
    const response = await POST(makeRequest('{}') as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(ApiError.INVALID_SIGNATURE);
  });

  it('returns 500 on webhook processing failure', async () => {
    mockHeadersGet.mockImplementation((name) => (name === 'stripe-signature' ? 't=123,v1=abc' : null));
    mockConstructEvent.mockReturnValue(Effect.succeed({ type: 'payment_intent.succeeded' }));
    mockProcessWebhookEvent.mockReturnValue(
      Effect.fail(new WebhookError({ message: 'Processing failed', isSignatureError: false }))
    );
    const response = await POST(makeRequest('{}') as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(ApiError.WEBHOOK_PROCESSING_FAILED);
  });

  it('returns 500 on unexpected typed error', async () => {
    mockHeadersGet.mockImplementation((name) => (name === 'stripe-signature' ? 't=123,v1=abc' : null));
    mockConstructEvent.mockReturnValue(
      Effect.fail(new Error('unexpected')) as unknown as Effect.Effect<{ type: string }, WebhookError>
    );
    const response = await POST(makeRequest('{}') as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(ApiError.WEBHOOK_PROCESSING_FAILED);
  });
});
