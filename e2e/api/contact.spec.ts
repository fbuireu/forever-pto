import { expect, test } from '@playwright/test';

const URL = '/api/contact';

test.describe('POST /api/contact', () => {
  test('returns 400 when body is empty', async ({ request }) => {
    const response = await request.post(URL, { data: {} });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  test('returns 400 when email is missing', async ({ request }) => {
    const response = await request.post(URL, {
      data: { name: 'Test User', subject: 'Hello', message: 'World' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('returns 400 when email is invalid', async ({ request }) => {
    const response = await request.post(URL, {
      data: { email: 'not-an-email', name: 'Test', subject: 'Hello', message: 'World' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.post(URL, { data: {} });
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
