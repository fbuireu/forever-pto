import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { createJSONStorage } from 'zustand/middleware';
import { decrypt, encrypt } from './utils/crypto';

const logger = getBetterStackInstance();

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY;
const isDev = process.env.NODE_ENV === 'development';
const isClient = globalThis.window !== undefined;

export const encryptedStorage = createJSONStorage(() => {
  if (!isClient) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  if (isDev || !SECRET_KEY) {
    return {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    };
  }

  const cryptoKey = SECRET_KEY;

  return {
    getItem: (key: string) => {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;

      try {
        return decrypt({ text: encryptedValue, key: cryptoKey });
      } catch (error) {
        logger.logError('Failed to decrypt storage value', error, { key });
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, encrypt({ text: value, key: cryptoKey }));
      } catch (error) {
        logger.logError('Failed to set item in encrypted storage', error, { key });
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.logError('Failed to remove item from encrypted storage', error, { key });
      }
    },
  };
});
