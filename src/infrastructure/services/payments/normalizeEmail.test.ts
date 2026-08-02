import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './normalizeEmail';

describe('normalizeEmail', () => {
  it('lower-cases, because the payments table compares addresses case-sensitively', () => {
    expect(normalizeEmail('Payer@Example.COM')).toBe('payer@example.com');
  });

  it('trims the whitespace a paste leaves behind', () => {
    expect(normalizeEmail('  payer@example.com \n')).toBe('payer@example.com');
  });

  it('leaves an already canonical address untouched', () => {
    expect(normalizeEmail('payer@example.com')).toBe('payer@example.com');
  });

  it('does not touch the local part beyond case, since dots and plus tags address real mailboxes', () => {
    expect(normalizeEmail('First.Last+pto@Example.com')).toBe('first.last+pto@example.com');
  });
});
