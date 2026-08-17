import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { logClient, logClientError } from './clientLog';

const { mockGetBetterStackInstance, mockLogError } = vi.hoisted(() => ({
  mockGetBetterStackInstance: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: mockGetBetterStackInstance,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('a client log never makes its caller asynchronous', () => {
  it('returns undefined, not a promise the caller would have to await', () => {
    mockGetBetterStackInstance.mockReturnValue({ logError: mockLogError });
    expect(logClient(() => {})).toBeUndefined();
    expect(logClientError('boom', new Error('x'))).toBeUndefined();
  });

  it('has not written by the time it returns, so a test must wait for the import', async () => {
    mockGetBetterStackInstance.mockReturnValue({ logError: mockLogError });

    logClientError('boom', new Error('x'), { component: 'Probe' });
    expect(mockLogError).not.toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(mockLogError).toHaveBeenCalledWith('boom', expect.any(Error), { component: 'Probe' });
    });
  });
});

describe('a client log never fails its caller', () => {
  it('swallows a logger that throws once the import resolves', async () => {
    mockGetBetterStackInstance.mockImplementation(() => {
      throw new Error('logger unavailable');
    });

    expect(() => logClientError('boom', new Error('x'))).not.toThrow();
    await vi.waitFor(() => {
      expect(mockGetBetterStackInstance).toHaveBeenCalled();
    });
  });

  it('swallows a write callback that throws', async () => {
    mockGetBetterStackInstance.mockReturnValue({ logError: mockLogError });

    expect(() =>
      logClient(() => {
        throw new Error('write failed');
      })
    ).not.toThrow();
    await vi.waitFor(() => {
      expect(mockGetBetterStackInstance).toHaveBeenCalled();
    });
  });
});

describe('the import that keeps the logging SDK out of every client chunk', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/application/shared/utils/clientLog.ts'), 'utf8');

  it('reaches the BetterStack client through a dynamic import', () => {
    expect(source).toMatch(/import\('@infrastructure\/clients\/logging\/better-stack\/client'\)/);
  });

  it('has no value-level static import of it', () => {
    expect(source).not.toMatch(/^import (?!type )[^\n]*better-stack\/client/m);
  });
});
