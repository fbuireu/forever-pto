import { describe, expect, it } from 'vitest';
import { CA, DE, EN, ES, FR, IT, LOCALES } from './locales';

describe('locale constants', () => {
  it('EN is "en"', () => {
    expect(EN).toBe('en');
  });

  it('ES is "es"', () => {
    expect(ES).toBe('es');
  });

  it('CA is "ca"', () => {
    expect(CA).toBe('ca');
  });

  it('IT is "it"', () => {
    expect(IT).toBe('it');
  });

  it('FR is "fr"', () => {
    expect(FR).toBe('fr');
  });

  it('DE is "de"', () => {
    expect(DE).toBe('de');
  });
});

describe('LOCALES', () => {
  it('contains all six supported locales', () => {
    expect(LOCALES).toHaveLength(6);
  });

  it('contains EN', () => {
    expect(LOCALES).toContain(EN);
  });

  it('contains ES', () => {
    expect(LOCALES).toContain(ES);
  });

  it('contains CA', () => {
    expect(LOCALES).toContain(CA);
  });

  it('contains IT', () => {
    expect(LOCALES).toContain(IT);
  });

  it('contains FR', () => {
    expect(LOCALES).toContain(FR);
  });

  it('contains DE', () => {
    expect(LOCALES).toContain(DE);
  });

  it('contains no duplicates', () => {
    expect(new Set(LOCALES).size).toBe(LOCALES.length);
  });
});
