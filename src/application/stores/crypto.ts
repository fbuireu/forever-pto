import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { createJSONStorage } from 'zustand/middleware';
import type { CryptoParams } from './types';

const logger = getBetterStackInstance();

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY;
const isDev = process.env.NODE_ENV === 'development';
const isClient = globalThis.window !== undefined;
const hasNodeAPIs = typeof Buffer !== 'undefined';

function base64Encode(str: string): string {
  if (hasNodeAPIs) {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}

function base64Decode(str: string): string {
  try {
    if (hasNodeAPIs) {
      return Buffer.from(str, 'base64').toString('utf-8');
    }
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    logger.logError('Failed to decode base64 in crypto storage', error, {
      hasNodeAPIs,
      stringLength: str?.length,
    });
    return '';
  }
}

function encrypt({ text, key }: CryptoParams): string {
  const encrypted = text
    .split('')
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
  return base64Encode(encrypted);
}

function decrypt({ text, key }: CryptoParams): string {
  try {
    const decoded = base64Decode(text);
    return decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  } catch (error) {
    logger.logError('Failed to decrypt storage value in crypto', error, {
      hasText: !!text,
      textLength: text?.length,
      hasKey: !!key,
    });
    return '';
  }
}

export const encryptedStorage = createJSONStorage(() => {
  if (!isClient) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  if (isDev) {
    return {
      getItem: (key: string): string | null => localStorage.getItem(key),
      setItem: (key: string, value: string): void => localStorage.setItem(key, value),
      removeItem: (key: string): void => localStorage.removeItem(key),
    };
  }
  return {
    getItem: (key: string): string | null => {
      try {
        const encryptedValue = localStorage.getItem(key);
        if (!encryptedValue) return null;
        const decrypted = decrypt({ text: encryptedValue, key: SECRET_KEY });
        if (!decrypted) {
          logger.warn('Decryption returned empty value, removing corrupted storage', { key });
          localStorage.removeItem(key);
          return null;
        }
        return decrypted;
      } catch (error) {
        logger.logError('Failed to get item from encrypted storage', error, { key });
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          logger.logError('Failed to remove corrupted item', removeError);
        }
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        const encrypted = encrypt({ text: value, key: SECRET_KEY });
        localStorage.setItem(key, encrypted);
      } catch (error) {
        logger.logError('Failed to set item in encrypted storage', error, { key });
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.logError('Failed to remove item from encrypted storage', error, { key });
      }
    },
  };
});
