import deMessages from '@i18n/messages/de.json';
import enMessages from '@i18n/messages/en.json';
import esMessages from '@i18n/messages/es.json';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const JAN = (day: number) => new Date(2025, 0, day);

const filtersState = {
  ptoDays: 3,
  country: 'ES',
  region: '',
  strategy: 'grouped',
  year: 2025,
  carryOverMonths: 0,
};

const holidaysState = {
  suggestion: null as unknown,
  holidays: [] as unknown[],
  alternatives: [] as unknown[],
  currentSelection: null as unknown,
  manuallySelectedDays: [] as Date[],
  removedSuggestedDays: [] as Date[],
};

vi.mock('@application/stores/filters', () => ({
  useFiltersStore: (selector: (state: typeof filtersState) => unknown) => selector(filtersState),
}));
vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock('@application/stores/location', () => ({
  useLocationStore: (selector: (state: { countries: unknown[]; regions: unknown[] }) => unknown) =>
    selector({ countries: [], regions: [] }),
}));
vi.mock('@application/stores/premium', () => ({
  usePremiumStore: (selector: (state: { premiumKey: string | null }) => unknown) => selector({ premiumKey: 'key' }),
}));
vi.mock('@ui/hooks/useStoresReady', () => ({ useStoresReady: () => ({ areStoresReady: true }) }));
vi.mock('@application/i18n/navigation', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('boneyard-js/react', () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@ui/modules/premium/PremiumFeature', () => ({
  PremiumFeature: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@ui/modules/core/animate/text/SlidingNumber', () => ({
  SlidingNumber: ({ number }: { number: string | number }) => <span>{number}</span>,
}));
vi.mock('@ui/modules/core/animate/text/Rotating', () => ({ RotatingText: () => null }));

import { Summary } from './Summary';

const METRICS = {
  longWeekends: 0,
  restBlocks: 0,
  maxWorkStreak: 0,
  firstLastBreak: null,
  averageEfficiency: 2.5,
  bonusDays: 0,
  quarterDist: [0, 0, 0, 0],
  bridgesUsed: 0,
  monthlyDist: new Array(12).fill(0),
  longBlocksPerQuarter: [0, 0, 0, 0],
  totalEffectiveDays: 5,
  workedDaysPerMonth: 20,
};

const renderSummary = (locale = 'en', messages: object = enMessages) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Summary />
    </NextIntlClientProvider>
  );

describe('Summary efficiency hint', () => {
  it('names the days the metrics were measured against, not the days the engine first placed', () => {
    holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: 'grouped', metrics: METRICS };
    holidaysState.currentSelection = null;
    holidaysState.manuallySelectedDays = [];
    holidaysState.removedSuggestedDays = [JAN(7)];

    const { container } = renderSummary();

    expect(container.textContent).toContain('per day spent (2)');
    expect(container.textContent).not.toContain('per day spent (3)');
  });

  it('counts a hand-picked day the engine never placed', () => {
    holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: 'grouped', metrics: METRICS };
    holidaysState.currentSelection = null;
    holidaysState.manuallySelectedDays = [JAN(20)];
    holidaysState.removedSuggestedDays = [];

    const { container } = renderSummary();

    expect(container.textContent).toContain('per day spent (4)');
  });
});

describe('Summary budget badges at a budget of one', () => {
  const singleDayPlan = () => {
    filtersState.ptoDays = 1;
    holidaysState.suggestion = { days: [JAN(6)], bridges: [], strategy: 'grouped', metrics: METRICS };
    holidaysState.currentSelection = null;
    holidaysState.manuallySelectedDays = [];
    holidaysState.removedSuggestedDays = [];
  };

  it('says one day, not one days, in Spanish', () => {
    singleDayPlan();

    const { container } = renderSummary('es', esMessages);

    expect(container.textContent).toContain('presupuesto de 1 día');
    expect(container.textContent).not.toContain('presupuesto de 1 días');

    filtersState.ptoDays = 3;
  });

  it('says one Tag, not one Tagen, in German', () => {
    singleDayPlan();

    const { container } = renderSummary('de', deMessages);

    expect(container.textContent).toContain('Budget von 1 Tag');
    expect(container.textContent).not.toContain('Budget von 1 Tagen');

    filtersState.ptoDays = 3;
  });
});
