export const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
export const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;

export interface CryptoParams {
  text: string;
  key: string;
}

export function base64Encode(str: string) {
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = Array.from(utf8Bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binaryString);
}

export function base64Decode(str: string) {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.codePointAt(i) ?? 0;
  }
  return new TextDecoder().decode(bytes);
}

export function encrypt({ text, key }: CryptoParams) {
  const encrypted = text
    .split('')
    .map((char, i) => String.fromCodePoint((char.codePointAt(0) ?? 0) ^ (key.codePointAt(i % key.length) ?? 0)))
    .join('');
  return base64Encode(encrypted);
}

export function decrypt({ text, key }: CryptoParams) {
  const decoded = base64Decode(text);
  return decoded
    .split('')
    .map((char, i) => String.fromCodePoint((char.codePointAt(0) ?? 0) ^ (key.codePointAt(i % key.length) ?? 0)))
    .join('');
}
