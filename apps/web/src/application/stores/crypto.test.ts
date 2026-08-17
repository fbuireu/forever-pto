import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersistStorage } from 'zustand/middleware';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockObfuscate, mockDeobfuscate } = vi.hoisted(() => ({
  mockObfuscate: vi.fn(({ text }: { text: string }) => `obf::${text}`),
  mockDeobfuscate: vi.fn(({ text }: { text: string }) => text.replace('obf::', '')),
}));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

vi.mock('./utils/crypto', () => ({
  obfuscate: mockObfuscate,
  deobfuscate: mockDeobfuscate,
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const STATE_VALUE = { state: { holidays: [] }, version: 1 };
const JSON_STATE = JSON.stringify(STATE_VALUE);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('SSR (no window)', () => {
  let storage: PersistStorage<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    const { obfuscatedStorage } = await import('./crypto');
    expect(obfuscatedStorage).toBeDefined();
    storage = obfuscatedStorage as PersistStorage<unknown>;
  });

  it('getItem returns null', () => {
    expect(storage.getItem('test-key')).toBeNull();
  });

  it('setItem does not throw', () => {
    expect(() => storage.setItem('test-key', STATE_VALUE as never)).not.toThrow();
  });

  it('removeItem does not throw', () => {
    expect(() => storage.removeItem('test-key')).not.toThrow();
  });
});

describe('dev mode', () => {
  let storage: PersistStorage<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('localStorage', mockLocalStorage);
    const { obfuscatedStorage } = await import('./crypto');
    expect(obfuscatedStorage).toBeDefined();
    storage = obfuscatedStorage as PersistStorage<unknown>;
  });

  it('getItem reads from localStorage and returns parsed JSON', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    const result = storage.getItem('test-key');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    expect(result).toEqual(STATE_VALUE);
  });

  it('getItem returns null when key is absent', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    expect(storage.getItem('test-key')).toBeNull();
  });

  it('setItem writes JSON-stringified value to localStorage', () => {
    storage.setItem('test-key', STATE_VALUE as never);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON_STATE);
  });

  it('removeItem delegates to localStorage', () => {
    storage.removeItem('test-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('does not call obfuscate or deobfuscate', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    storage.getItem('test-key');
    storage.setItem('test-key', STATE_VALUE as never);
    expect(mockObfuscate).not.toHaveBeenCalled();
    expect(mockDeobfuscate).not.toHaveBeenCalled();
  });
});

describe('prod mode without SECRET_KEY', () => {
  let storage: PersistStorage<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STORAGE_KEY', '');
    vi.stubGlobal('localStorage', mockLocalStorage);
    const { obfuscatedStorage } = await import('./crypto');
    expect(obfuscatedStorage).toBeDefined();
    storage = obfuscatedStorage as PersistStorage<unknown>;
  });

  it('falls back to localStorage without obfuscating', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    storage.getItem('test-key');
    expect(mockDeobfuscate).not.toHaveBeenCalled();
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });
});

describe('prod mode with SECRET_KEY', () => {
  const OBFUSCATED = `obf::${JSON_STATE}`;
  let storage: PersistStorage<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STORAGE_KEY', 'secret-key');
    vi.stubGlobal('localStorage', mockLocalStorage);
    const { obfuscatedStorage } = await import('./crypto');
    expect(obfuscatedStorage).toBeDefined();
    storage = obfuscatedStorage as PersistStorage<unknown>;
  });

  it('getItem deobfuscates the stored value', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(OBFUSCATED);
    mockDeobfuscate.mockReturnValueOnce(JSON_STATE);
    const result = storage.getItem('test-key');
    expect(mockDeobfuscate).toHaveBeenCalledWith({ text: OBFUSCATED, key: 'secret-key' });
    expect(result).toEqual(STATE_VALUE);
  });

  it('getItem returns null when localStorage has no value', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    expect(storage.getItem('test-key')).toBeNull();
  });

  it('getItem returns null and logs error when deobfuscate throws', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce('bad-data');
    mockDeobfuscate.mockImplementationOnce(() => {
      throw new Error('deobfuscate failed');
    });
    expect(storage.getItem('test-key')).toBeNull();
    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Failed to deobfuscate storage value', expect.any(Error), {
        key: 'test-key',
      })
    );
  });

  it('defers the log behind a dynamic import, so getItem returns before the client is loaded', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce('bad-data');
    mockDeobfuscate.mockImplementationOnce(() => {
      throw new Error('deobfuscate failed');
    });
    storage.getItem('test-key');
    expect(mockLogError).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(mockLogError).toHaveBeenCalledTimes(1));
  });

  it('setItem obfuscates and writes to localStorage', () => {
    mockObfuscate.mockReturnValueOnce('obfuscated-result');
    storage.setItem('test-key', STATE_VALUE as never);
    expect(mockObfuscate).toHaveBeenCalledWith({ text: JSON_STATE, key: 'secret-key' });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'obfuscated-result');
  });

  it('setItem logs error when obfuscate throws', async () => {
    mockObfuscate.mockImplementationOnce(() => {
      throw new Error('obfuscate failed');
    });
    storage.setItem('test-key', STATE_VALUE as never);
    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Failed to set item in obfuscated storage', expect.any(Error), {
        key: 'test-key',
      })
    );
  });

  it('removeItem calls localStorage.removeItem', () => {
    storage.removeItem('test-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('removeItem logs error when localStorage.removeItem throws', async () => {
    mockLocalStorage.removeItem.mockImplementationOnce(() => {
      throw new Error('remove failed');
    });
    storage.removeItem('test-key');
    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Failed to remove item from obfuscated storage', expect.any(Error), {
        key: 'test-key',
      })
    );
  });
});
