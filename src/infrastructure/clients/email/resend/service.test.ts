import { EmailError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSend, MockResend } = vi.hoisted(() => {
  const mockSend = vi.fn();
  class MockResend {
    emails = { send: mockSend };
  }
  return { mockSend, MockResend };
});

vi.mock('resend', () => ({ Resend: MockResend }));

const { ResendService, ResendServiceLive } = await import('./service');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 're_test_key';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const baseParams = {
  from: 'noreply@forever-pto.com',
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Hello</p>',
};

describe('ResendServiceLive initialisation', () => {
  it('throws when RESEND_API_KEY is missing', () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect(() => Effect.runSync(Effect.provide(ResendService, ResendServiceLive))).toThrow('RESEND_API_KEY');
  });
});

describe('ResendService.send', () => {
  it('returns messageId from the API response', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_abc123' }, error: null });
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const resend = yield* ResendService;
        return yield* resend.send(baseParams);
      }).pipe(Effect.provide(ResendServiceLive))
    );
    expect(result.messageId).toBe('msg_abc123');
  });

  it('returns undefined messageId when data is null', async () => {
    mockSend.mockResolvedValue({ data: null, error: null });
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const resend = yield* ResendService;
        return yield* resend.send(baseParams);
      }).pipe(Effect.provide(ResendServiceLive))
    );
    expect(result.messageId).toBeUndefined();
  });

  it('wraps Resend API errors as EmailError', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const resend = yield* ResendService;
        return yield* resend.send(baseParams).pipe(Effect.flip);
      }).pipe(Effect.provide(ResendServiceLive))
    );
    expect(error).toBeInstanceOf(EmailError);
  });

  it('wraps network errors thrown by the SDK as EmailError', async () => {
    mockSend.mockRejectedValue(new Error('network timeout'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const resend = yield* ResendService;
        return yield* resend.send(baseParams).pipe(Effect.flip);
      }).pipe(Effect.provide(ResendServiceLive))
    );
    expect(error).toBeInstanceOf(EmailError);
  });

  it('passes all send params through to the SDK', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
    await Effect.runPromise(
      Effect.gen(function* () {
        const resend = yield* ResendService;
        yield* resend.send({ ...baseParams, replyTo: 'reply@example.com' });
      }).pipe(Effect.provide(ResendServiceLive))
    );
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'reply@example.com' }));
  });
});
