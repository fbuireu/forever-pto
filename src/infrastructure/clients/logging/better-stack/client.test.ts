import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogtail, MockLogtail } = vi.hoisted(() => {
  const mockLogtail = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  class MockLogtail {
    debug = mockLogtail.debug;
    info = mockLogtail.info;
    warn = mockLogtail.warn;
    error = mockLogtail.error;
  }
  return { mockLogtail, MockLogtail };
});

vi.mock('@logtail/edge', () => ({
  Logtail: vi.fn().mockImplementation(MockLogtail as unknown as () => InstanceType<typeof MockLogtail>),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockReturnValue({ ctx: {} }),
}));

process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = 'test-token';
process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL = 'https://test.logtail.com';

const { BetterStackClient, getBetterStackInstance } = await import('./client');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBetterStackInstance', () => {
  it('returns the same instance on repeated calls', () => {
    const a = getBetterStackInstance();
    const b = getBetterStackInstance();
    expect(a).toBe(b);
  });

  it('returns a BetterStackClient', () => {
    expect(getBetterStackInstance()).toBeInstanceOf(BetterStackClient);
  });
});

describe('BetterStackClient.logError', () => {
  it('includes error message, name and stack in context', () => {
    const client = new BetterStackClient();
    const err = new Error('boom');
    client.logError('test event', err);
    const [, ctx] = mockLogtail.error.mock.calls[0];
    expect(ctx.error.message).toBe('boom');
    expect(ctx.error.name).toBe('Error');
    expect(ctx.error.stack).toContain('Error: boom');
  });

  it('handles non-Error values', () => {
    const client = new BetterStackClient();
    client.logError('test', 'string error');
    const [, ctx] = mockLogtail.error.mock.calls[0];
    expect(ctx.error.message).toBe('string error');
    expect(ctx.error.name).toBe('UnknownError');
    expect(ctx.error.stack).toBeUndefined();
  });

  it('merges caller context with error context', () => {
    const client = new BetterStackClient();
    client.logError('test', new Error('x'), { requestId: 'req-1' });
    const [, ctx] = mockLogtail.error.mock.calls[0];
    expect(ctx.requestId).toBe('req-1');
    expect(ctx.error.message).toBe('x');
  });
});

describe('BetterStackClient.logDuration', () => {
  it('logs duration_ms and duration_seconds', () => {
    const client = new BetterStackClient();
    client.logDuration('my-op', 250);
    const [msg, ctx] = mockLogtail.info.mock.calls[0];
    expect(msg).toBe('my-op completed');
    expect(ctx.duration_ms).toBe(250);
    expect(ctx.duration_seconds).toBe(0.25);
  });
});

describe('BetterStackClient.measureAsync', () => {
  it('returns the function result', async () => {
    const client = new BetterStackClient();
    const result = await client.measureAsync('op', async () => 42);
    expect(result).toBe(42);
  });

  it('rethrows errors thrown by the function', async () => {
    const client = new BetterStackClient();
    await expect(
      client.measureAsync('op', async () => {
        throw new Error('fail');
      })
    ).rejects.toThrow('fail');
  });

  it('logs success duration after a successful call', async () => {
    const client = new BetterStackClient();
    await client.measureAsync('op', async () => 'x');
    expect(mockLogtail.info).toHaveBeenCalled();
    const [, ctx] = mockLogtail.info.mock.calls[0];
    expect(ctx.status).toBe('success');
    expect(typeof ctx.duration_ms).toBe('number');
  });

  it('logs error context when the function throws', async () => {
    const client = new BetterStackClient();
    await client
      .measureAsync('op', async () => {
        throw new Error('e');
      })
      .catch(() => {});
    expect(mockLogtail.error).toHaveBeenCalled();
    const [, ctx] = mockLogtail.error.mock.calls[0];
    expect(ctx.status).toBe('error');
  });
});

describe('BetterStackClient.withContext', () => {
  it('returns a new BetterStackClient instance', () => {
    const client = new BetterStackClient();
    const child = client.withContext({ traceId: 'abc' });
    expect(child).toBeInstanceOf(BetterStackClient);
    expect(child).not.toBe(client);
  });

  it('child client includes the added context when logging', () => {
    const client = new BetterStackClient();
    const child = client.withContext({ traceId: 'abc' });
    child.info('test');
    const [, ctx] = mockLogtail.info.mock.calls[0];
    expect(ctx.traceId).toBe('abc');
  });
});

describe('BetterStackClient without configured tokens', () => {
  it('does not throw and no-ops logging when tokens are missing', async () => {
    vi.resetModules();
    const prevToken = process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN;
    const prevUrl = process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL;
    const mutableEnv = process.env as Record<string, string | undefined>;
    delete mutableEnv.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN;
    delete mutableEnv.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { BetterStackClient: FreshClient } = await import('./client');
      const client = new FreshClient();

      expect(() => client.warn('boom')).not.toThrow();
      expect(() => client.error('boom')).not.toThrow();
      expect(() => client.logError('boom', new Error('x'))).not.toThrow();
      expect(mockLogtail.warn).not.toHaveBeenCalled();
      expect(mockLogtail.error).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnce();
    } finally {
      warnSpy.mockRestore();
      process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = prevToken;
      process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL = prevUrl;
      vi.resetModules();
    }
  });
});
