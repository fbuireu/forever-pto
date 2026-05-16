import { expect, test } from '@playwright/test';

const URL = '/api/check-session';

test.describe('GET /api/check-session', () => {
  test('returns 200 with null fields when no session cookie is present', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.premiumKey).toBeNull();
    expect(body.email).toBeNull();
  });

  test('sets Cache-Control: no-store', async ({ request }) => {
    const response = await request.get(URL);
    expect(response.headers()['cache-control']).toContain('no-store');
  });
});

test.describe('POST /api/check-session', () => {
  test('returns 400 when email is missing', async ({ request }) => {
    const response = await request.post(URL, { data: { premiumKey: 'pi_test' } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('email_required');
  });

  test('returns 400 when email has no associated payment', async ({ request }) => {
    const response = await request.post(URL, { data: { email: 'nonexistent@example.com' } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('returns 400 when premiumKey does not match a valid payment', async ({ request }) => {
    const response = await request.post(URL, {
      data: { email: 'test@example.com', premiumKey: 'pi_invalid_key' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
