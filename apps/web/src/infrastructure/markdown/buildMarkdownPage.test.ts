import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateTranslator } = vi.hoisted(() => ({
  mockCreateTranslator: vi.fn(),
}));

vi.mock('next-intl', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next-intl')>()),
  createTranslator: mockCreateTranslator,
}));

vi.mock('../../../package.json', () => ({
  default: { version: '1.2.3' },
}));

import { buildMarkdownPage } from './buildMarkdownPage';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe('stays free of request-scoped translation APIs', () => {
  it('never imports next-intl/server', () => {
    const source = readFileSync(join(__dirname, 'buildMarkdownPage.ts'), 'utf8');
    expect(source).not.toContain('next-intl/server');
  });
});

describe('buildMarkdownPage', () => {
  beforeEach(() => {
    mockCreateTranslator.mockImplementation(
      ({ namespace }: { namespace: string }) =>
        (key: string) =>
          `[${namespace}:${key}]`
    );
  });

  describe('route resolution is exact, not a substring match', () => {
    it.each([
      ['/legal/privacy-policy-2024', '[metadata:privacyPolicy.title]'],
      ['/es/legal/privacy-policy/archive', '[metadata:privacyPolicy.title]'],
      ['/planner-comparison', '[metadata:planner.title]'],
    ])('does not serve %s as the route it merely contains', async (pathname, foreignTitle) => {
      const result = await buildMarkdownPage(BASE_URL, pathname);
      expect(result).not.toContain(foreignTitle);
      expect(result).toContain('[metadata:title]');
    });

    it.each([
      ['/legal/privacy-policy', '[metadata:privacyPolicy.title]'],
      ['/es/legal/privacy-policy', '[metadata:privacyPolicy.title]'],
      ['/payment/confirmation', '[metadata:paymentConfirmation.title]'],
    ])('still serves %s itself', async (pathname, title) => {
      expect(await buildMarkdownPage(BASE_URL, pathname)).toContain(title);
    });

    it('resolves the homepage by matching the empty path, not by falling through', async () => {
      const { findRoute } = await import('@infrastructure/seo/routes');
      expect(findRoute('')?.titleKey).toBe('title');
    });
  });

  describe('non-planner path', () => {
    it('uses t("title") as the page title', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain('[metadata:title]');
    });

    it('uses t("description") as the page description', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain('[metadata:description]');
    });

    it('includes the package version', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain('1.2.3');
    });

    it('includes the base URL in the Site section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain(`## Site\n\n${BASE_URL}`);
    });

    it('includes the planner URL for the default locale', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain(`${BASE_URL}/planner`);
    });

    it('includes a locale-prefixed planner URL for non-default locales', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/es');
      expect(result).toContain(`${BASE_URL}/es/planner`);
    });

    it('includes the Features section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain('## Features');
    });

    it('includes the API section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).toContain('## API');
    });

    it('does not include the planner How to Use section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/');
      expect(result).not.toContain('## How to Use');
    });
  });

  describe('planner path', () => {
    it('uses metadata namespace for the page title', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('[metadata:planner.title]');
    });

    it('uses metadata namespace for the page description', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('[metadata:planner.description]');
    });

    it('uses planner namespace for the section heading', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('## [planner:title]');
    });

    it('uses planner namespace for the section body', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('[planner:description]');
    });

    it('includes the package version', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('1.2.3');
    });

    it('includes the planner URL in the URL section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain(`## URL\n\n${BASE_URL}/planner`);
    });

    it('includes a locale-prefixed planner URL for non-default locales', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/es/planner');
      expect(result).toContain(`${BASE_URL}/es/planner`);
    });

    it('includes the How to Use section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).toContain('## How to Use');
    });

    it('does not include the Site section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).not.toContain('## Site');
    });

    it('does not include the API section', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/planner');
      expect(result).not.toContain('## API');
    });
  });

  describe('every other route gets its own twin, not the homepage', () => {
    const ROUTES = [
      ['/legal/cookie-policy', 'cookiePolicy'],
      ['/legal/privacy-policy', 'privacyPolicy'],
      ['/legal/terms-of-service', 'termsOfService'],
      ['/legal/legal-notice', 'legalNotice'],
    ] as const;

    it.each(ROUTES)('titles %s from its own metadata entry', async (path, namespaceKey) => {
      const result = await buildMarkdownPage(BASE_URL, path);

      expect(result).toContain(`# [metadata:${namespaceKey}.title]`);
      expect(result).toContain(`[metadata:${namespaceKey}.description]`);
    });

    it.each(ROUTES)('does not hand %s the homepage body', async (path) => {
      const result = await buildMarkdownPage(BASE_URL, path);

      expect(result).not.toContain('## Site');
      expect(result).not.toContain('## API');
      expect(result).not.toContain('[metadata:description]');
    });

    it.each(ROUTES)('points %s at its own canonical URL', async (path) => {
      const result = await buildMarkdownPage(BASE_URL, path);

      expect(result).toContain(`## URL\n\n${BASE_URL}${path}`);
    });

    it('carries the locale prefix on a non-default locale', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/es/legal/privacy-policy');

      expect(result).toContain(`${BASE_URL}/es/legal/privacy-policy`);
    });

    it('titles the confirmation page, which has no description of its own', async () => {
      const result = await buildMarkdownPage(BASE_URL, '/payment/confirmation');

      expect(result).toContain('# [metadata:paymentConfirmation.title]');
      expect(result).not.toContain('[metadata:description]');
    });
  });
});
