import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  logError: vi.fn(),
};

vi.mock('./client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue(mockLogger),
}));

const { LoggerService, LoggerServiceLive } = await import('./service');

describe('LoggerService', () => {
  it('resolves to the BetterStackClient instance when provided', async () => {
    const logger = await Effect.runPromise(LoggerService.pipe(Effect.provide(LoggerServiceLive)));
    expect(logger).toBe(mockLogger);
  });

  it('exposes all required logging methods', async () => {
    const logger = await Effect.runPromise(LoggerService.pipe(Effect.provide(LoggerServiceLive)));
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.logError).toBe('function');
  });
});
