import { expect, test } from '@playwright/test';

const URL = '/api/payment';

test.describe('POST /api/payment', () => {
  test('returns 400 when body is empty', async ({ request }) => {
    const response = await request.post(URL, { data: {} });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  test('returns 400 when amount is missing', async ({ request }) => {
    const response = await request.post(URL, { data: { email: 'user@example.com' } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('returns 400 when email is missing', async ({ request }) => {
    const response = await request.post(URL, { data: { amount: 9.99 } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.post(URL, { data: {} });
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('returns 429 after exceeding rate limit', async ({ request }) => {
    const payload = { email: 'ratelimit@example.com', amount: 9.99 };
    const statuses: number[] = [];
    for (let i = 0; i < 15; i++) {
      const response = await request.post(URL, { data: payload });
      statuses.push(response.status());
      if (response.status() === 429) break;
    }
    expect(statuses).toContain(429);
  });
});
