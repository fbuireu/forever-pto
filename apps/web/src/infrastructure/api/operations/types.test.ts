import { describe, expect, it } from 'vitest';
import { resolveClientIp, UNKNOWN_IP } from './types';

const headers = (entries: Record<string, string>) => new Headers(entries);

describe('resolveClientIp', () => {
  it('prefers cf-connecting-ip, the only header a client cannot forge behind Cloudflare', () => {
    const ip = resolveClientIp(
      headers({
        'cf-connecting-ip': '203.0.113.1',
        'x-forwarded-for': '198.51.100.9',
        'x-real-ip': '192.0.2.5',
      })
    );

    expect(ip).toBe('203.0.113.1');
  });

  it('falls back to x-forwarded-for when Cloudflare did not set its own', () => {
    expect(resolveClientIp(headers({ 'x-forwarded-for': '198.51.100.9', 'x-real-ip': '192.0.2.5' }))).toBe(
      '198.51.100.9'
    );
  });

  it('falls back to x-real-ip last', () => {
    expect(resolveClientIp(headers({ 'x-real-ip': '192.0.2.5' }))).toBe('192.0.2.5');
  });

  it('answers null when no header carries an address, rather than inventing one', () => {
    expect(resolveClientIp(headers({}))).toBeNull();
  });

  it('keeps UNKNOWN_IP out of the answer, because that is the limiter key and not an address', () => {
    expect(resolveClientIp(headers({}))).not.toBe(UNKNOWN_IP);
  });
});
