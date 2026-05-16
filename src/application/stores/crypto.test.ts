import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockEncrypt, mockDecrypt } = vi.hoisted(() => ({
  mockEncrypt: vi.fn(({ text }: { text: string }) => `enc::${text}`),
  mockDecrypt: vi.fn(({ text }: { text: string }) => text.replace('enc::', '')),
}));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError }),
}));

vi.mock('./utils/crypto', () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
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
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
  });

  it('getItem returns null', async () => {
    const { encryptedStorage } = await import('./crypto');
    expect(encryptedStorage.getItem('test-key')).toBeNull();
  });

  it('setItem does not throw', async () => {
    const { encryptedStorage } = await import('./crypto');
    expect(() => encryptedStorage.setItem('test-key', STATE_VALUE as never)).not.toThrow();
  });

  it('removeItem does not throw', async () => {
    const { encryptedStorage } = await import('./crypto');
    expect(() => encryptedStorage.removeItem('test-key')).not.toThrow();
  });
});

describe('dev mode', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('getItem reads from localStorage and returns parsed JSON', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    const { encryptedStorage } = await import('./crypto');
    const result = encryptedStorage.getItem('test-key');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    expect(result).toEqual(STATE_VALUE);
  });

  it('getItem returns null when key is absent', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    const { encryptedStorage } = await import('./crypto');
    expect(encryptedStorage.getItem('test-key')).toBeNull();
  });

  it('setItem writes JSON-stringified value to localStorage', async () => {
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.setItem('test-key', STATE_VALUE as never);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON_STATE);
  });

  it('removeItem delegates to localStorage', async () => {
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.removeItem('test-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('does not call encrypt or decrypt', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.getItem('test-key');
    encryptedStorage.setItem('test-key', STATE_VALUE as never);
    expect(mockEncrypt).not.toHaveBeenCalled();
    expect(mockDecrypt).not.toHaveBeenCalled();
  });
});

describe('prod mode without SECRET_KEY', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STORAGE_KEY', '');
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('falls back to localStorage without encrypting', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON_STATE);
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.getItem('test-key');
    expect(mockDecrypt).not.toHaveBeenCalled();
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });
});

describe('prod mode with SECRET_KEY', () => {
  const ENCRYPTED = 'enc::' + JSON_STATE;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {});
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STORAGE_KEY', 'secret-key');
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('getItem decrypts the stored value', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(ENCRYPTED);
    mockDecrypt.mockReturnValueOnce(JSON_STATE);
    const { encryptedStorage } = await import('./crypto');
    const result = encryptedStorage.getItem('test-key');
    expect(mockDecrypt).toHaveBeenCalledWith({ text: ENCRYPTED, key: 'secret-key' });
    expect(result).toEqual(STATE_VALUE);
  });

  it('getItem returns null when localStorage has no value', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    const { encryptedStorage } = await import('./crypto');
    expect(encryptedStorage.getItem('test-key')).toBeNull();
  });

  it('getItem returns null and logs error when decrypt throws', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce('bad-data');
    mockDecrypt.mockImplementationOnce(() => {
      throw new Error('decrypt failed');
    });
    const { encryptedStorage } = await import('./crypto');
    expect(encryptedStorage.getItem('test-key')).toBeNull();
    expect(mockLogError).toHaveBeenCalledWith('Failed to decrypt storage value', expect.any(Error), { key: 'test-key' });
  });

  it('setItem encrypts and writes to localStorage', async () => {
    mockEncrypt.mockReturnValueOnce('encrypted-result');
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.setItem('test-key', STATE_VALUE as never);
    expect(mockEncrypt).toHaveBeenCalledWith({ text: JSON_STATE, key: 'secret-key' });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'encrypted-result');
  });

  it('setItem logs error when encrypt throws', async () => {
    mockEncrypt.mockImplementationOnce(() => {
      throw new Error('encrypt failed');
    });
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.setItem('test-key', STATE_VALUE as never);
    expect(mockLogError).toHaveBeenCalledWith('Failed to set item in encrypted storage', expect.any(Error), { key: 'test-key' });
  });

  it('removeItem calls localStorage.removeItem', async () => {
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.removeItem('test-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('removeItem logs error when localStorage.removeItem throws', async () => {
    mockLocalStorage.removeItem.mockImplementationOnce(() => {
      throw new Error('remove failed');
    });
    const { encryptedStorage } = await import('./crypto');
    encryptedStorage.removeItem('test-key');
    expect(mockLogError).toHaveBeenCalledWith('Failed to remove item from encrypted storage', expect.any(Error), { key: 'test-key' });
  });
});
