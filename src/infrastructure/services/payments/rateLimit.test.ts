import { RateLimitError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

const { checkRateLimit } = await import('./rateLimit');

const mockKvGet = vi.fn();
const mockKvPut = vi.fn();

const makeContext = (count: string | null = null) =>
  mockGetCloudflareContext.mockResolvedValue({
    env: { RATE_LIMIT_KV: { get: mockKvGet, put: mockKvPut } },
  }) && mockKvGet.mockResolvedValue(count);

beforeEach(() => {
  vi.clearAllMocks();
  mockKvPut.mockResolvedValue(undefined);
});

describe('checkRateLimit', () => {
  it('succeeds when the IP has no previous requests', async () => {
    makeContext(null);
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });

  it('increments the counter and stores it', async () => {
    makeContext('3');
    await Effect.runPromise(checkRateLimit('1.2.3.4'));
    expect(mockKvPut).toHaveBeenCalledWith('rl:payment:1.2.3.4', '4', expect.objectContaining({ expirationTtl: 60 }));
  });

  it('uses the correct KV key for the given IP', async () => {
    makeContext(null);
    await Effect.runPromise(checkRateLimit('9.9.9.9'));
    expect(mockKvGet).toHaveBeenCalledWith('rl:payment:9.9.9.9');
  });

  it('fails with RateLimitError when the limit is reached', async () => {
    makeContext('10');
    const error = await Effect.runPromise(Effect.flip(checkRateLimit('1.2.3.4')));
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).ip).toBe('1.2.3.4');
  });

  it('fails with RateLimitError when count exceeds the limit', async () => {
    makeContext('15');
    const error = await Effect.runPromise(Effect.flip(checkRateLimit('1.2.3.4')));
    expect(error).toBeInstanceOf(RateLimitError);
  });

  it('succeeds when count is one below the limit', async () => {
    makeContext('9');
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });

  it('passes gracefully when the Cloudflare context throws', async () => {
    mockGetCloudflareContext.mockRejectedValue(new Error('CF unavailable'));
    await expect(Effect.runPromise(checkRateLimit('1.2.3.4'))).resolves.toBeUndefined();
  });
});
