import { expect, test } from '@playwright/test';

const URL = '/api/health';

test.describe('GET /api/health', () => {
  test('returns 200', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.status()).toBe(200);
  });

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('body has status ok', async ({ request }) => {
    const body = await (await request.get(URL)).json();
    expect(body.status).toBe('ok');
  });

  test('body has a valid ISO timestamp', async ({ request }) => {
    const body = await (await request.get(URL)).json();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  test('body has env object with expected keys', async ({ request }) => {
    const body = await (await request.get(URL)).json();
    expect(body.env).toHaveProperty('hasStripeKey');
    expect(body.env).toHaveProperty('hasTursoUrl');
    expect(body.env).toHaveProperty('hasTursoToken');
    expect(body.env).toHaveProperty('nodeEnv');
  });

  test('sets Cache-Control: no-store', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.headers()['cache-control']).toContain('no-store');
  });
});
