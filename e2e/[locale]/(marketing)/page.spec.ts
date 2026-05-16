import { ES } from '../../../src/infrastructure/i18n/locales';
import { expect, test } from '@playwright/test';

test.describe('(marketing) homepage', () => {
  test('returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('has a non-empty title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });

  test('renders main#main-content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('renders the hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero')).toBeVisible();
  });

  test('renders the features section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#features')).toBeVisible();
  });

  test('renders the pricing section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#pricing')).toBeVisible();
  });

  test('renders the faq section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#faq')).toBeVisible();
  });

  test('has a link to the planner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/planner"]').first()).toBeVisible();
  });

  test('renders in the requested locale', async ({ page }) => {
    await page.goto(`/${ES}`);
    await expect(page.locator('html')).toHaveAttribute('lang', ES);
  });

  test('locale-prefixed homepage returns 200', async ({ page }) => {
    const response = await page.goto(`/${ES}`);
    expect(response?.status()).toBe(200);
  });
});
