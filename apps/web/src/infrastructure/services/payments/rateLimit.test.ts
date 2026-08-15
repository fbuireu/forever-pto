import { RateLimitError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

const { checkRateLimit } = await import('./rateLimit');

const mockLimit = vi.fn();

const makeContext = () =>
  mockGetCloudflareContext.mockResolvedValue({
    env: { PAYMENT_RATE_LIMITER: { limit: mockLimit } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockLimit.mockResolvedValue({ success: true });
});

describe('checkRateLimit', () => {
  it('succeeds when the limiter admits the request', async () => {
    makeContext();
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });

  it('keys the limiter on the IP', async () => {
    makeContext();
    await Effect.runPromise(checkRateLimit('9.9.9.9'));
    expect(mockLimit).toHaveBeenCalledWith({ key: '9.9.9.9' });
  });

  it('fails with RateLimitError when the limiter refuses', async () => {
    makeContext();
    mockLimit.mockResolvedValue({ success: false });
    const error = await Effect.runPromise(Effect.flip(checkRateLimit('1.2.3.4')));
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).ip).toBe('1.2.3.4');
  });

  it('counts a parallel burst from one IP, rather than letting it through', async () => {
    makeContext();
    let admitted = 0;
    mockLimit.mockImplementation(async () => {
      admitted += 1;
      return { success: admitted <= 10 };
    });

    const outcomes = await Promise.all(
      Array.from({ length: 200 }, () => Effect.runPromise(Effect.either(checkRateLimit('1.2.3.4'))))
    );
    const passed = outcomes.filter((outcome) => outcome._tag === 'Right').length;

    expect(mockLimit).toHaveBeenCalledTimes(200);
    expect(passed).toBe(10);
  });

  it('passes gracefully when the Cloudflare context throws', async () => {
    mockGetCloudflareContext.mockRejectedValue(new Error('CF unavailable'));
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });

  it('passes gracefully when the limiter itself throws', async () => {
    makeContext();
    mockLimit.mockRejectedValue(new Error('limiter unavailable'));
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });
});
