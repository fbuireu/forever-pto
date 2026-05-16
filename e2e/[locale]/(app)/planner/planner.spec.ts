import { ES } from '../../../../src/infrastructure/i18n/locales';
import { expect, test } from '@playwright/test';

const PLANNER_PATH = '/planner';

test.describe('(app) planner', () => {
  test('returns 200', async ({ page }) => {
    const response = await page.goto(PLANNER_PATH);
    expect(response?.status()).toBe(200);
  });

  test('has a non-empty title', async ({ page }) => {
    await page.goto(PLANNER_PATH);
    await expect(page).toHaveTitle(/.+/);
  });

  test('does not trigger the error boundary', async ({ page }) => {
    await page.goto(PLANNER_PATH);
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeAttached();
  });

  test('locale-prefixed planner returns 200', async ({ page }) => {
    const response = await page.goto(`/${ES}${PLANNER_PATH}`);
    expect(response?.status()).toBe(200);
  });

  test('renders in the requested locale', async ({ page }) => {
    await page.goto(`/${ES}${PLANNER_PATH}`);
    await expect(page.locator('html')).toHaveAttribute('lang', ES);
  });

  test('renders a link back to the homepage', async ({ page }) => {
    await page.goto(PLANNER_PATH);
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });
});
