import { createJSONStorage } from 'zustand/middleware';

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

function encrypt(text: string, key: string): string {
  return btoa(
    text
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('')
  );
}

function decrypt(encryptedText: string, key: string): string {
  try {
    const decoded = atob(encryptedText);
    return decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  } catch (error) {
    console.warn('Failed to decrypt storage value:', error);
    return '';
  }
}

export const encryptedStorage = createJSONStorage(() => ({
  getItem: (key: string): string | null => {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    const decrypted = decrypt(encryptedValue, SECRET_KEY);
    return decrypted || null;
  },

  setItem: (key: string, value: string): void => {
    const encrypted = encrypt(value, SECRET_KEY);
    localStorage.setItem(key, encrypted);
  },

  removeItem: (key: string): void => localStorage.removeItem(key),
}));
