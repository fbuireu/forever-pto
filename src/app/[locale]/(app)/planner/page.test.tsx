import { EN, ES, LOCALES } from '@infrastructure/i18n/locales';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetRequestLocale = vi.fn();
const MockJsonLd = vi.fn().mockReturnValue(null);

vi.mock('next-intl/server', () => ({ setRequestLocale: mockSetRequestLocale }));

vi.mock('next/dynamic', () => ({
  default: vi.fn().mockImplementation(() => vi.fn().mockReturnValue(null)),
}));

vi.mock('@ui/modules/shared/seo/JsonLd', () => ({ JsonLd: MockJsonLd }));

vi.mock('@infrastructure/i18n/config', async () => {
  const { LOCALES } = await import('@infrastructure/i18n/locales');
  return { LOCALES };
});

const { default: AppPage, generateStaticParams } = await import('./page');

const makeParams = (locale = EN) => ({ params: Promise.resolve({ locale: locale as never }) });

describe('planner/page', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generateStaticParams', () => {
    it('returns one entry per locale', () => {
      expect(generateStaticParams()).toHaveLength(LOCALES.length);
    });

    it('covers all supported locales', () => {
      const locales = generateStaticParams().map((p) => p.locale);
      expect(locales).toEqual(expect.arrayContaining(LOCALES));
    });
  });

  describe('AppPage', () => {
    it('calls setRequestLocale with the resolved locale', async () => {
      await AppPage(makeParams());
      expect(mockSetRequestLocale).toHaveBeenCalledWith(EN);
    });

    it('calls setRequestLocale with a different locale', async () => {
      await AppPage(makeParams(ES));
      expect(mockSetRequestLocale).toHaveBeenCalledWith(ES);
    });

    it('returns a React fragment', async () => {
      const element = await AppPage(makeParams());
      expect(element.type).toBe(React.Fragment);
    });

    it('renders JsonLd with the resolved locale', async () => {
      await AppPage(makeParams(ES));
      const element = await AppPage(makeParams(ES));
      const children = [element.props.children].flat();
      const jsonLdEl = children.find((c: unknown) => (c as { type?: unknown })?.type === MockJsonLd);
      expect(jsonLdEl).toBeDefined();
      expect((jsonLdEl as { props: { locale: string } }).props.locale).toBe(ES);
    });

    it('renders a section with the planner className', async () => {
      const element = await AppPage(makeParams());
      const children = [element.props.children].flat();
      const sectionEl = children.find((c: unknown) => (c as { type?: unknown })?.type === 'section');
      expect(sectionEl).toBeDefined();
      expect((sectionEl as { props: { className: string } }).props.className).toContain('flex');
    });

    it('section contains seven dynamic components', async () => {
      const element = await AppPage(makeParams());
      const children = [element.props.children].flat();
      const sectionEl = children.find((c: unknown) => (c as { type?: unknown })?.type === 'section');
      const sectionChildren = [(sectionEl as { props: { children: unknown } }).props.children].flat();
      expect(sectionChildren).toHaveLength(7);
    });
  });
});
