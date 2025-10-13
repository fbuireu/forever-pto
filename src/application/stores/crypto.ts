import { createJSONStorage } from 'zustand/middleware';
import type { CryptoParams } from './types';

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY ?? 'fallback-secret-key';
const isDev = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';
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
    console.warn('Failed to decode base64:', error);
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
    console.warn('Failed to decrypt storage value:', error);
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
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      const decrypted = decrypt({ text: encryptedValue, key: SECRET_KEY });
      return decrypted ?? null;
    },
    setItem: (key: string, value: string): void => {
      const encrypted = encrypt({ text: value, key: SECRET_KEY });
      localStorage.setItem(key, encrypted);
    },
    removeItem: (key: string): void => localStorage.removeItem(key),
  };
});
