import { type DayOutcome, DayRefusal } from '@application/stores/types';
import en from '@i18n/messages/en.json';
import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockToastInfo, mockToastWarning, premiumKey } = vi.hoisted(() => ({
  mockToastInfo: vi.fn(),
  mockToastWarning: vi.fn(),
  premiumKey: { current: 'key' as string | null },
}));

vi.mock('sonner', () => ({ toast: { info: mockToastInfo, warning: mockToastWarning } }));

vi.mock('@application/stores/premium', () => ({
  usePremiumStore: (selector: (state: unknown) => unknown) => selector({ premiumKey: premiumKey.current }),
}));

vi.mock('@ui/modules/shared/SupportButton', () => ({ SupportButton: () => null }));

const { usePlannerDayClick } = await import('./usePlannerDayClick');

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale='en' messages={en}>
    {children}
  </NextIntlClientProvider>
);

const DATE = new Date(2026, 4, 1);

const clickWith = (toggle: (date: Date) => DayOutcome) => {
  const { result } = renderHook(() => usePlannerDayClick(toggle), { wrapper });
  result.current(DATE);
};

beforeEach(() => {
  vi.clearAllMocks();
  premiumKey.current = 'key';
});

describe('usePlannerDayClick', () => {
  it('never reaches the store for a visitor without Premium', () => {
    premiumKey.current = null;
    const toggle = vi.fn<(date: Date) => DayOutcome>(() => ({ applied: true }));

    clickWith(toggle);

    expect(toggle).not.toHaveBeenCalled();
    expect(mockToastInfo).toHaveBeenCalledWith(en.premium.premiumFeature, expect.anything());
  });

  it('stays silent when the store applies the toggle', () => {
    const toggle = vi.fn<(date: Date) => DayOutcome>(() => ({ applied: true }));

    clickWith(toggle);

    expect(toggle).toHaveBeenCalledWith(DATE);
    expect(mockToastWarning).not.toHaveBeenCalled();
    expect(mockToastInfo).not.toHaveBeenCalled();
  });

  it('tells the user why the store refused, in that refusal own words', () => {
    clickWith(() => ({ applied: false, reason: DayRefusal.BUDGET_EXHAUSTED }));

    expect(mockToastWarning).toHaveBeenCalledWith(en.toasts.noPtoDaysRemaining, {
      description: en.toasts.removeDaysToFree,
    });
  });

  it('says nothing for a refusal that has no copy, which is what NO_PLAN means', () => {
    clickWith(() => ({ applied: false, reason: DayRefusal.NO_PLAN }));

    expect(mockToastWarning).not.toHaveBeenCalled();
  });
});
