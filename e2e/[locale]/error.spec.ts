import { expect, test } from '@playwright/test';

test.describe('[locale] error boundary', () => {
  test('homepage does not trigger the error boundary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('500');
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeAttached();
  });

  test('planner does not trigger the error boundary', async ({ page }) => {
    await page.goto('/planner');
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeAttached();
  });
});
