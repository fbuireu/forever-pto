import type { StateStorage } from 'zustand/middleware';

const isDev = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

const BROWSER_STORAGE = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    localStorage.removeItem(key);
  },
};

function getDeviceKey(): string {
  const DEVICE_KEY_NAME = '__device_crypto_key';

  if (!isClient) {
    return process.env.NEXT_PUBLIC_STORAGE_KEY;
  }

  let deviceKey = BROWSER_STORAGE.getItem(DEVICE_KEY_NAME);

  if (!deviceKey) {
    const uniqueDeviceKey = crypto.getRandomValues(new Uint8Array(32));
    deviceKey = btoa(String.fromCharCode(...uniqueDeviceKey));
    BROWSER_STORAGE.setItem(DEVICE_KEY_NAME, deviceKey);
  }

  return deviceKey;
}

const DEVICE_KEY = getDeviceKey();

const keyCache = new Map<string, CryptoKey>();

interface DeriveKeyParams {
  password: string;
  storeName: string;
  version: number;
}

async function deriveKey({ password, storeName, version }: DeriveKeyParams): Promise<CryptoKey> {
  const cacheKey = `${storeName}-v${version}`;

  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, [
    'deriveBits',
    'deriveKey',
  ]);

  const salt = encoder.encode(cacheKey);

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, derivedKey);

  return derivedKey;
}
interface BaseCryptoParams {
  text: string;
  storeName: string;
  version: number;
}

async function encrypt({ text, storeName, version }: BaseCryptoParams): Promise<string> {
  const encoder = new TextEncoder();
  const key = await deriveKey({ password: DEVICE_KEY, storeName, version });
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt({ text, storeName, version }: BaseCryptoParams): Promise<string | null> {
  try {
    const key = await deriveKey({ password: DEVICE_KEY, storeName, version });

    const combined = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt storage value:', error);
    return null;
  }
}

interface CreateEncryptedStorageParams {
  storeName: string;
  version: number;
}

export function createEncryptedStorage({ storeName, version }: CreateEncryptedStorageParams) {
  const memoryStore = new Map<string, string>();
  const pendingWrites = new Map<string, Promise<void>>();

  const storage: StateStorage = {
    getItem: (key: string): string | null => {
      return memoryStore.get(key) ?? null;
    },

    setItem: (key: string, value: string): void => {
      memoryStore.set(key, value);

      if (isClient) {
        const writePromise = (async () => {
          try {
            if (isDev) {
              BROWSER_STORAGE.setItem(key, value);
            } else {
              const encrypted = await encrypt({ text: value, storeName, version });
              BROWSER_STORAGE.setItem(key, encrypted);
            }
          } catch (err) {
            console.error('Failed to persist encrypted value:', err);
          } finally {
            pendingWrites.delete(key);
          }
        })();

        pendingWrites.set(key, writePromise);
      }
    },

    removeItem: (key: string): void => {
      memoryStore.delete(key);
      BROWSER_STORAGE.removeItem(key);
    },
  };

  return {
    storage,
    memoryStore,
    pendingWrites,
  };
}

export async function hydrateFromStorage(storeName: string, version: number = 0): Promise<string | null> {
  if (!isClient) return null;

  const stored = BROWSER_STORAGE.getItem(storeName);
  if (!stored) return null;

  try {
    if (isDev) {
      return stored;
    }
    return await decrypt({ text: stored, storeName, version });
  } catch (err) {
    console.error(`Failed to hydrate ${storeName}:`, err);
    return null;
  }
}

export async function flushPendingWrites(pendingWrites: Map<string, Promise<void>>): Promise<void> {
  await Promise.all(pendingWrites.values());
}
