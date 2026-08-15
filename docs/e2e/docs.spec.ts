import { expect, test } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Forever PTO/);
});

test('Button island hydrates and lifts on hover with app tokens', async ({ page }) => {
  await page.goto('/design-system/components/button/');
  const button = page.locator('[data-slot="button"]').first();
  await expect(button).toBeVisible();

  const shadow = await button.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe('none');

  await button.hover();
  await expect
    .poll(async () => button.evaluate((el) => getComputedStyle(el).translate), { timeout: 2000 })
    .toContain('-2px');
});

test('theme toggle flips data-theme and app tokens', async ({ page }) => {
  await page.goto('/');
  const frameOf = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--frame').trim());

  await page.emulateMedia({ colorScheme: 'light' });
  const select = page.locator('starlight-theme-select select').first();
  await select.selectOption('light');
  const lightFrame = await frameOf();

  await select.selectOption('dark');
  await expect(page.locator(':root[data-theme="dark"]')).toHaveCount(1);
  const darkFrame = await frameOf();

  expect(lightFrame).not.toBe(darkFrame);
});

test('search index is built (pagefind)', async ({ page }) => {
  await page.goto('/');
  const response = await page.request.get('/pagefind/pagefind.js');
  expect(response.ok()).toBeTruthy();
});

test('spanish locale is served', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('404 page works', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');
  expect(response?.status()).toBe(404);
});

test('sitemap and robots are served', async ({ page }) => {
  expect((await page.request.get('/sitemap-index.xml')).ok()).toBeTruthy();
  expect((await page.request.get('/robots.txt')).ok()).toBeTruthy();
});
