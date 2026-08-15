import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFiltersState,
  mockHolidaysState,
  mockPrune,
  mockClearCalculation,
  mockFetchHolidays,
  mockTriggerCalculation,
} = vi.hoisted(() => ({
  mockFiltersState: {
    carryOverMonths: 0,
    year: 2026,
    allowPastDays: true,
    country: 'ES',
    region: '',
    ptoDays: 10,
    strategy: 'grouped',
  },
  mockHolidaysState: {
    holidays: [
      { id: 'h1', date: new Date(2026, 0, 1), name: 'New Year', variant: 'national', isInSelectedRange: true },
    ],
    alternatives: [],
    suggestion: null,
    currentSelection: null,
    isCalculating: false,
    manuallySelectedDays: [],
    removedSuggestedDays: [],
    previewAlternativeIndex: 0,
    planRevision: 0,
  },
  mockPrune: vi.fn(),
  mockClearCalculation: vi.fn(),
  mockFetchHolidays: vi.fn(),
  mockTriggerCalculation: vi.fn(),
}));

vi.mock('@application/stores/filters', () => ({
  useFiltersStore: (selector: (state: unknown) => unknown) => selector(mockFiltersState),
}));

vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: (selector: (state: unknown) => unknown) =>
    selector({
      ...mockHolidaysState,
      fetchHolidays: mockFetchHolidays,
      toggleDaySelection: vi.fn(),
      pruneDaysOutsideWindow: mockPrune,
      clearCalculation: mockClearCalculation,
    }),
}));

vi.mock('@ui/hooks/useCalculationsWorker', () => ({
  useCalculationsWorker: () => ({ triggerCalculation: mockTriggerCalculation }),
}));

vi.mock('@ui/hooks/useStoresReady', () => ({ useStoresReady: () => ({ areStoresReady: true }) }));

vi.mock('boneyard-js/react', () => ({
  Skeleton: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));

vi.mock('./calendar/Calendar', () => ({
  Calendar: () => null,
  CalendarSelectionMode: { MULTIPLE: 'multiple' },
}));

vi.mock('./calendar/CalendarListFixture', () => ({ CalendarListFixture: () => null }));

const { CalendarList } = await import('./CalendarList');

beforeEach(() => {
  vi.clearAllMocks();
  mockFiltersState.year = 2026;
  mockFiltersState.carryOverMonths = 0;
  mockHolidaysState.holidays = [
    { id: 'h1', date: new Date(2026, 0, 1), name: 'New Year', variant: 'national', isInSelectedRange: true },
  ] as never;
  mockHolidaysState.suggestion = null;
  (mockHolidaysState as { planRevision?: number }).planRevision = 0;
});

describe('CalendarList does not re-plan itself', () => {
  it('does not start another run when the worker writes its result back', () => {
    const { rerender } = render(<CalendarList />);
    expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);

    mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;
    rerender(<CalendarList />);
    mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;
    rerender(<CalendarList />);

    expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);
  });
});

describe('CalendarList re-plans on apply', () => {
  it('runs the engine again when a plan is applied, which is what reconciles the Manual Days', () => {
    const { rerender } = render(<CalendarList />);
    expect(mockTriggerCalculation).toHaveBeenCalledTimes(1);

    (mockHolidaysState as { planRevision?: number }).planRevision = 1;
    rerender(<CalendarList />);

    expect(mockTriggerCalculation).toHaveBeenCalledTimes(2);
  });
});

describe('CalendarList stale plans', () => {
  it('clears the plan when the window has no Holidays left to build one from', () => {
    mockHolidaysState.holidays = [];
    mockHolidaysState.suggestion = { days: [new Date(2026, 0, 5)] } as never;

    render(<CalendarList />);

    expect(mockClearCalculation).toHaveBeenCalled();
  });

  it('does not clear on a cold load, when there is no plan to go stale', () => {
    mockHolidaysState.holidays = [];
    mockHolidaysState.suggestion = null;

    render(<CalendarList />);

    expect(mockClearCalculation).not.toHaveBeenCalled();
  });
});

describe('CalendarList', () => {
  it('prunes hand-edited days whenever the planning window moves, so they stop spending budget', () => {
    const { rerender } = render(<CalendarList />);
    expect(mockPrune).toHaveBeenCalledWith({ year: 2026, carryOverMonths: 0 });

    mockPrune.mockClear();
    mockFiltersState.year = 2027;
    rerender(<CalendarList />);

    expect(mockPrune).toHaveBeenCalledWith({ year: 2027, carryOverMonths: 0 });
  });

  it('prunes when only the carry-over months move, which shifts the window without changing the year', () => {
    render(<CalendarList />);
    mockPrune.mockClear();

    mockFiltersState.carryOverMonths = 3;
    render(<CalendarList />);

    expect(mockPrune).toHaveBeenCalledWith({ year: 2026, carryOverMonths: 3 });
  });
});
