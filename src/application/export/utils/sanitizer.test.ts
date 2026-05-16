import { describe, expect, it } from 'vitest';
import { sanitize } from './sanitizer';

describe('sanitize', () => {
  it('passes through plain text unchanged', () => {
    expect(sanitize('New Year')).toBe('New Year');
  });

  it('escapes semicolons', () => {
    expect(sanitize('A;B')).toBe('A\\;B');
  });

  it('escapes commas', () => {
    expect(sanitize('A,B')).toBe('A\\,B');
  });

  it('escapes backslashes', () => {
    expect(sanitize('A\\B')).toBe('A\\\\B');
  });

  it('replaces newlines with \\n literal', () => {
    expect(sanitize('Line1\nLine2')).toBe('Line1\\nLine2');
  });

  it('escapes multiple special chars in sequence', () => {
    expect(sanitize('A;B,C\\D')).toBe('A\\;B\\,C\\\\D');
  });
});
