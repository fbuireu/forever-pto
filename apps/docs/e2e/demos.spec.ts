import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';

const DIST = join(import.meta.dirname, '..', 'dist');

const pages = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name === 'index.html' ? [path] : [];
  });

const demoPages = pages(DIST)
  .filter((path) => readFileSync(path, 'utf8').includes('data-demo'))
  .map((path) => `/${relative(DIST, path).replaceAll('\\', '/').replace(/index\.html$/, '')}`)
  .sort();

test('discovers the demo pages from what was built, so this suite cannot silently shrink', () => {
  expect(demoPages.length).toBeGreaterThanOrEqual(60);
});

for (const path of demoPages) {
  test(`demos hydrate without throwing on ${path}`, async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console.error: ${message.text()}`);
    });

    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);

    const demos = page.locator('[data-demo]');
    const count = await demos.count();
    expect(count, `${path} serves data-demo but renders none`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const demo = demos.nth(index);
      await demo.scrollIntoViewIfNeeded();
      await expect
        .poll(() => demo.evaluate((element) => element.childElementCount), {
          timeout: 5_000,
          message: `${path} demo #${index} is an empty frame`,
        })
        .toBeGreaterThan(0);
    }

    expect(failures, path).toEqual([]);
  });
}
