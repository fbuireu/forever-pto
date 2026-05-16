import { describe, expect, it } from 'vitest';
import { noStore } from './response';

describe('noStore', () => {
  it('returns a JSON response with the given body', async () => {
    const response = noStore({ success: true });
    const body = await response.json();
    expect(body).toEqual({ success: true });
  });

  it('sets Cache-Control: no-store header', () => {
    const response = noStore({ ok: true });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('defaults to status 200', () => {
    const response = noStore({ ok: true });
    expect(response.status).toBe(200);
  });

  it('forwards a custom status code', () => {
    const response = noStore({ error: 'not found' }, { status: 404 });
    expect(response.status).toBe(404);
  });

  it('forwards custom headers alongside Cache-Control', () => {
    const response = noStore({ ok: true }, { headers: { 'X-Custom': 'value' } });
    expect(response.headers.get('X-Custom')).toBe('value');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('serialises nested objects correctly', async () => {
    const body = { data: { id: 1, tags: ['a', 'b'] } };
    const response = noStore(body);
    expect(await response.json()).toEqual(body);
  });
});
