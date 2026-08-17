import { describe, expect, it } from 'vitest';
import { markdownTwinHeaders } from './twin';

describe('markdownTwinHeaders', () => {
  it('caches a page that exists', () => {
    expect(markdownTwinHeaders({ found: true })['Cache-Control']).toBe('public, max-age=3600');
  });

  it('never lets a shared cache keep a miss, which a policy set before the lookup could not express', () => {
    const cacheControl = markdownTwinHeaders({ found: false })['Cache-Control'];

    expect(cacheControl).toBe('no-store');
    expect(cacheControl).not.toContain('max-age');
    expect(cacheControl).not.toContain('public');
  });

  it('serves markdown only when there is a page, and plain text for the miss body', () => {
    expect(markdownTwinHeaders({ found: true })['Content-Type']).toBe('text/markdown; charset=utf-8');
    expect(markdownTwinHeaders({ found: false })['Content-Type']).toBe('text/plain; charset=utf-8');
  });

  it('varies on Accept in both cases, so no cache can serve one representation for the other', () => {
    expect(markdownTwinHeaders({ found: true }).Vary).toBe('Accept');
    expect(markdownTwinHeaders({ found: false }).Vary).toBe('Accept');
  });
});
