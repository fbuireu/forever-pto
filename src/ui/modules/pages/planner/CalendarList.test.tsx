import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFiltersState, mockHolidaysState, mockPrune, mockFetchHolidays, mockTriggerCalculation } = vi.hoisted(
  () => ({
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
    },
    mockPrune: vi.fn(),
    mockFetchHolidays: vi.fn(),
    mockTriggerCalculation: vi.fn(),
  })
);

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
