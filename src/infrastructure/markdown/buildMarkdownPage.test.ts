import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));

vi.mock('../../../package.json', () => ({
  default: { version: '1.2.3' },
}));

import { buildMarkdownPage } from './buildMarkdownPage';

const BASE_URL = 'https://forever-pto.com';

describe('buildMarkdownPage', () => {
  beforeEach(() => {
    mockGetTranslations.mockImplementation(({ namespace }: { namespace: string }) =>
      Promise.resolve((key: string) => `[${namespace}:${key}]`)
    );
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
});
