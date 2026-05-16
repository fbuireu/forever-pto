import { EN, ES, LOCALES } from '@infrastructure/i18n/locales';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetRequestLocale = vi.fn();

vi.mock('next-intl/server', () => ({ setRequestLocale: mockSetRequestLocale }));

vi.mock('@infrastructure/i18n/config', async () => {
  const { LOCALES } = await import('@infrastructure/i18n/locales');
  return { LOCALES };
});

const MockHero = vi.fn().mockReturnValue(null);
const MockMarquee = vi.fn().mockReturnValue(null);
const MockHowItWorks = vi.fn().mockReturnValue(null);
const MockStats = vi.fn().mockReturnValue(null);
const MockFeatures = vi.fn().mockReturnValue(null);
const MockComparison = vi.fn().mockReturnValue(null);
const MockTestimonials = vi.fn().mockReturnValue(null);
const MockPricing = vi.fn().mockReturnValue(null);
const MockFaq = vi.fn().mockReturnValue(null);
const MockHomepageCta = vi.fn().mockReturnValue(null);
const MockDonateClient = vi.fn().mockReturnValue(null);

vi.mock('@ui/modules/pages/homepage/sections/Hero', () => ({ Hero: MockHero }));
vi.mock('@ui/modules/pages/homepage/sections/Marquee', () => ({ Marquee: MockMarquee }));
vi.mock('@ui/modules/pages/homepage/sections/HowItWorks', () => ({ HowItWorks: MockHowItWorks }));
vi.mock('@ui/modules/pages/homepage/sections/Stats', () => ({ Stats: MockStats }));
vi.mock('@ui/modules/pages/homepage/sections/Features', () => ({ Features: MockFeatures }));
vi.mock('@ui/modules/pages/homepage/sections/Comparison', () => ({ Comparison: MockComparison }));
vi.mock('@ui/modules/pages/homepage/sections/Testimonials', () => ({ Testimonials: MockTestimonials }));
vi.mock('@ui/modules/pages/homepage/sections/Pricing', () => ({ Pricing: MockPricing }));
vi.mock('@ui/modules/pages/homepage/sections/Faq', () => ({ Faq: MockFaq }));
vi.mock('@ui/modules/pages/homepage/sections/HomepageCta', () => ({ HomepageCta: MockHomepageCta }));
vi.mock('@ui/modules/shared/donate/DonateClient', () => ({ DonateClient: MockDonateClient }));

const { default: HomePage, generateStaticParams } = await import('./page');

describe('(marketing)/page', () => {
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

  describe('HomePage', () => {
    it('calls setRequestLocale with the resolved locale', async () => {
      await HomePage({ params: Promise.resolve({ locale: EN as never }) });
      expect(mockSetRequestLocale).toHaveBeenCalledWith(EN);
    });

    it('renders a main element with id main-content', async () => {
      const element = await HomePage({ params: Promise.resolve({ locale: EN as never }) });
      expect(element.type).toBe('main');
      expect(element.props.id).toBe('main-content');
    });

    it('renders with flex-1 class', async () => {
      const element = await HomePage({ params: Promise.resolve({ locale: EN as never }) });
      expect(element.props.className).toContain('flex-1');
    });

    it('renders all sections', async () => {
      const element = await HomePage({ params: Promise.resolve({ locale: ES as never }) });
      const children: unknown[] = [element.props.children].flat();
      const types = children.map((c) => (c as { type?: unknown })?.type);
      expect(types).toContain(MockHero);
      expect(types).toContain(MockMarquee);
      expect(types).toContain(MockHowItWorks);
      expect(types).toContain(MockStats);
      expect(types).toContain(MockFeatures);
      expect(types).toContain(MockComparison);
      expect(types).toContain(MockTestimonials);
      expect(types).toContain(MockPricing);
      expect(types).toContain(MockFaq);
      expect(types).toContain(MockHomepageCta);
      expect(types).toContain(MockDonateClient);
    });
  });
});
