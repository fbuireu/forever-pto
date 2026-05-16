import { expect, test } from '@playwright/test';
import { ES } from '@infrastructure/i18n/locales';

const NONEXISTENT = '/this-route-does-not-exist-xyz';

test.describe('[locale] not-found', () => {
  test('returns 404 for an unknown path', async ({ page }) => {
    const response = await page.goto(NONEXISTENT);
    expect(response?.status()).toBe(404);
  });

  test('renders the 404 heading', async ({ page }) => {
    await page.goto(NONEXISTENT);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('vacation');
  });

  test('shows a link back to home', async ({ page }) => {
    await page.goto(NONEXISTENT);
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('shows a link to the planner', async ({ page }) => {
    await page.goto(NONEXISTENT);
    await expect(page.getByRole('link', { name: /planner/i })).toBeVisible();
  });

  test('returns 404 for a locale-prefixed unknown path', async ({ page }) => {
    const response = await page.goto(`/${ES}${NONEXISTENT}`);
    expect(response?.status()).toBe(404);
  });

  test('renders in the requested locale', async ({ page }) => {
    await page.goto(`/${ES}${NONEXISTENT}`);
    await expect(page.locator('html')).toHaveAttribute('lang', ES);
  });
});
