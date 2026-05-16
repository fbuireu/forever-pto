import { Temporal } from 'temporal-polyfill';

if (typeof globalThis.Temporal === 'undefined') {
  Object.defineProperty(globalThis, 'Temporal', { value: Temporal });
}
