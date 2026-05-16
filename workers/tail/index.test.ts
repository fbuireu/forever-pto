import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

const ENV = {
  BETTER_STACK_SOURCE_TOKEN: 'token-abc',
  BETTER_STACK_INGESTING_URL: 'https://logs.example.com/ingest',
};

const makeEvent = (overrides: Partial<{
  scriptName: string;
  outcome: string;
  event: { request?: { url: string; method: string; headers: Record<string, string> }; response?: { status: number } } | null;
  logs: Array<{ message: unknown[]; level: string; timestamp: number }>;
  exceptions: Array<{ name: string; message: string; timestamp: number }>;
}> = {}) => ({
  scriptName: 'forever-pto',
  outcome: 'ok',
  eventTimestamp: 1700000000000,
  event: {
    request: { url: 'https://forever-pto.com/api/test', method: 'GET', headers: {} },
    response: { status: 200 },
  },
  logs: [],
  exceptions: [],
  ...overrides,
});

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tail worker', () => {
  describe('when there are no entries', () => {
    it('does not call fetch when the events array is empty', async () => {
      await worker.tail([], ENV);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not call fetch when all events have no logs and no exceptions', async () => {
      await worker.tail([makeEvent()], ENV);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('log entries', () => {
    it('sends a POST request to BETTER_STACK_INGESTING_URL', async () => {
      await worker.tail([makeEvent({ logs: [{ message: ['hello'], level: 'log', timestamp: 1700000000000 }] })], ENV);
      expect(mockFetch).toHaveBeenCalledWith(ENV.BETTER_STACK_INGESTING_URL, expect.objectContaining({ method: 'POST' }));
    });

    it('sets the Authorization header with the Bearer token', async () => {
      await worker.tail([makeEvent({ logs: [{ message: ['msg'], level: 'info', timestamp: 1700000000000 }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer token-abc');
    });

    it('sets Content-Type to application/json', async () => {
      await worker.tail([makeEvent({ logs: [{ message: ['msg'], level: 'info', timestamp: 1700000000000 }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    it('maps log entries with dt, level, message and base fields', async () => {
      const ts = 1700000000000;
      await worker.tail([makeEvent({ logs: [{ message: ['hello', 'world'], level: 'warn', timestamp: ts }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body[0]).toMatchObject({
        dt: new Date(ts).toISOString(),
        level: 'warn',
        message: 'hello world',
        script: 'forever-pto',
        outcome: 'ok',
        url: 'https://forever-pto.com/api/test',
        method: 'GET',
        status: 200,
      });
    });

    it('joins multiple message parts into a single string', async () => {
      await worker.tail([makeEvent({ logs: [{ message: ['part1', 42, true], level: 'log', timestamp: 1 }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body[0].message).toBe('part1 42 true');
    });
  });

  describe('exception entries', () => {
    it('maps exceptions with level "error" and formatted message', async () => {
      const ts = 1700000001000;
      await worker.tail([makeEvent({ exceptions: [{ name: 'TypeError', message: 'is not a function', timestamp: ts }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body[0]).toMatchObject({
        dt: new Date(ts).toISOString(),
        level: 'error',
        message: 'TypeError: is not a function',
        script: 'forever-pto',
        outcome: 'ok',
      });
    });
  });

  describe('null event', () => {
    it('sets url, method and status to undefined when event is null', async () => {
      await worker.tail([makeEvent({ event: null, logs: [{ message: ['msg'], level: 'log', timestamp: 1 }] })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body[0].url).toBeUndefined();
      expect(body[0].method).toBeUndefined();
      expect(body[0].status).toBeUndefined();
    });
  });

  describe('multiple events', () => {
    it('flattens entries from multiple events into a single array', async () => {
      const events = [
        makeEvent({ logs: [{ message: ['log1'], level: 'log', timestamp: 1 }] }),
        makeEvent({ logs: [{ message: ['log2'], level: 'info', timestamp: 2 }] }),
      ];
      await worker.tail(events, ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body).toHaveLength(2);
      expect(body[0].message).toBe('log1');
      expect(body[1].message).toBe('log2');
    });

    it('includes both logs and exceptions from the same event', async () => {
      await worker.tail([makeEvent({
        logs: [{ message: ['log msg'], level: 'log', timestamp: 1 }],
        exceptions: [{ name: 'Error', message: 'boom', timestamp: 2 }],
      })], ENV);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body).toHaveLength(2);
      expect(body[0].level).toBe('log');
      expect(body[1].level).toBe('error');
    });

    it('sends exactly one fetch call regardless of the number of events', async () => {
      const events = Array.from({ length: 5 }, () =>
        makeEvent({ logs: [{ message: ['x'], level: 'log', timestamp: 1 }] })
      );
      await worker.tail(events, ENV);
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });
});
