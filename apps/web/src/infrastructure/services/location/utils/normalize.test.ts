import { describe, expect, it } from 'vitest';
import { normalizeCountryCode, TOR_COUNTRY, UNIDENTIFIED_COUNTRY } from './normalize';

describe('normalizeCountryCode', () => {
  it('lower-cases a valid code', () => {
    expect(normalizeCountryCode('ES')).toBe('es');
  });

  it('trims before deciding, because the CDN trace carries a line ending', () => {
    expect(normalizeCountryCode('  DE \n')).toBe('de');
  });

  it.each([[UNIDENTIFIED_COUNTRY], [TOR_COUNTRY], ['xx'], ['t1']])(
    'rejects %s, which is a signal rather than a Country',
    (sentinel) => {
      expect(normalizeCountryCode(sentinel)).toBe('');
    }
  );

  it.each([['ESP'], ['E'], ['12'], ['e5'], ['<script>'], [''], [null], [undefined]])(
    'rejects %o rather than letting it reach the Holiday lookup',
    (malformed) => {
      expect(normalizeCountryCode(malformed)).toBe('');
    }
  );
});
