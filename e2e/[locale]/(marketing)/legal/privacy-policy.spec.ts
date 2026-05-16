import { ES } from '../../../../src/infrastructure/i18n/locales';
import { expect, test } from '@playwright/test';

const PATH = '/legal/privacy-policy';

test.describe('(marketing) privacy-policy', () => {
  test('returns 200', async ({ page }) => {
    const response = await page.goto(PATH);
    expect(response?.status()).toBe(200);
  });

  test('has a non-empty title', async ({ page }) => {
    await page.goto(PATH);
    await expect(page).toHaveTitle(/.+/);
  });

  test('renders main#main-content', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('renders a heading', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('does not trigger the error boundary', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeAttached();
  });

  test('locale-prefixed privacy-policy returns 200', async ({ page }) => {
    const response = await page.goto(`/${ES}${PATH}`);
    expect(response?.status()).toBe(200);
  });
});
