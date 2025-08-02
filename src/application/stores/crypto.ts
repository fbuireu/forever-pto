import { createJSONStorage } from 'zustand/middleware';

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'your-fallback-secret-key';
const isDev = process.env.NODE_ENV === 'development';

interface CryptoParams {
    text: string;
    key: string;
}

function encrypt({text, key}: CryptoParams): string {
  return btoa(
    text
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('')
  );
}

function decrypt({ text, key }: CryptoParams): string {
  try {
    const decoded = atob(text);
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

      const decrypted = decrypt({text: encryptedValue, key: SECRET_KEY});
      return decrypted || null;
    },

    setItem: (key: string, value: string): void => {
      const encrypted = encrypt({text: value, key: SECRET_KEY});
      localStorage.setItem(key, encrypted);
    },

    removeItem: (key: string): void => localStorage.removeItem(key)
  };
});
