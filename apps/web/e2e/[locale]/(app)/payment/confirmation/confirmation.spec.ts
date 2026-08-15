import { expect, test } from '@playwright/test';
import { ES } from '@infrastructure/i18n/locales';

const CONFIRMATION_PATH = '/payment/confirmation';

test.describe('(app) payment/confirmation', () => {
  test('redirects to home when no payment_intent param', async ({ page }) => {
    await page.goto(CONFIRMATION_PATH);
    expect(page.url()).not.toContain(CONFIRMATION_PATH);
  });

  test('locale-prefixed confirmation redirects to locale home when no payment_intent', async ({ page }) => {
    await page.goto(`/${ES}${CONFIRMATION_PATH}`);
    expect(page.url()).not.toContain(CONFIRMATION_PATH);
  });

  test('does not trigger the error boundary on redirect', async ({ page }) => {
    await page.goto(CONFIRMATION_PATH);
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeAttached();
  });
});
