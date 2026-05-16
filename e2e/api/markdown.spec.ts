import { expect, test } from '@playwright/test';

const URL = '/api/markdown';

test.describe('GET /api/markdown', () => {
  test('returns 200', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.status()).toBe(200);
  });

  test('returns text/markdown content-type', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.headers()['content-type']).toContain('text/markdown');
  });

  test('returns non-empty markdown body', async ({ request }) => {
    const text = await (await request.get(URL)).text();
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('#');
  });

  test('sets Cache-Control with public max-age', async ({ request }) => {
    const cacheControl = (await request.get(URL)).headers()['cache-control'];
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('max-age=3600');
  });

  test('accepts path query param', async ({ request }) => {
    const response = await request.get(`${URL}?path=/en/planner`);
    expect(response.status()).toBe(200);
  });
});
