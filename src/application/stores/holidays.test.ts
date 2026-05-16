import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HolidayVariant, type HolidayDTO } from '@application/dto/holiday/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { useHolidaysStore } from './holidays';

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: vi.fn(), warn: vi.fn() }),
}));

vi.mock('./crypto', () => ({
  encryptedStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./location', () => ({
  useLocationStore: { getState: vi.fn().mockReturnValue({ regions: [] }) },
}));

vi.mock('@application/dto/holiday/dto', () => ({
  holidayDTO: {
    createCustom: vi.fn(({ name, date }: { name: string; date: Date }) => ({
      id: `custom-${date.toISOString()}`,
      name,
      date,
      variant: HolidayVariant.CUSTOM,
      isInSelectedRange: true,
    })),
    normalize: vi.fn((holidays: HolidayDTO[]) => holidays),
  },
}));

vi.mock('@infrastructure/services/calendar/metrics/generateMetrics', () => ({
  generateMetrics: vi.fn().mockReturnValue({ totalDays: 0, efficiency: 0 }),
}));

const makeHoliday = (id: string, dateStr: string, variant = HolidayVariant.NATIONAL): HolidayDTO => ({
  id,
  date: new Date(dateStr),
  name: `Holiday ${id}`,
  variant,
  isInSelectedRange: true,
});

const makeSuggestion = (days: Date[]): Suggestion => ({
  days,
  bridges: [],
  metrics: { totalDays: days.length } as never,
});

const INITIAL = {
  holidays: [],
  suggestion: null,
  maxAlternatives: 4,
  alternatives: [],
  currentSelection: null,
  previewAlternativeSelection: null,
  previewAlternativeIndex: 0,
  currentSelectionIndex: 0,
  manuallySelectedDays: [],
  removedSuggestedDays: [],
  isCalculating: false,
};

beforeEach(() => {
  useHolidaysStore.setState(INITIAL);
  vi.clearAllMocks();
});

describe('addHoliday', () => {
  it('adds a new holiday to the list', () => {
    const date = new Date('2026-01-01');
    useHolidaysStore.getState().addHoliday({ holiday: { name: 'New Year', date, type: 'public' }, locale: 'en', year: 2026, carryOverMonths: 1 });
    expect(useHolidaysStore.getState().holidays).toHaveLength(1);
    expect(useHolidaysStore.getState().holidays[0].name).toBe('New Year');
  });

  it('does not add a holiday when one already exists on the same date', () => {
    const date = new Date('2026-01-01');
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    useHolidaysStore.getState().addHoliday({ holiday: { name: 'Duplicate', date, type: 'public' }, locale: 'en', year: 2026, carryOverMonths: 1 });
    expect(useHolidaysStore.getState().holidays).toHaveLength(1);
  });

  it('sorts holidays by date after adding', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-06-01')] });
    const earlyDate = new Date('2026-01-15');
    useHolidaysStore.getState().addHoliday({ holiday: { name: 'Early', date: earlyDate, type: 'public' }, locale: 'en', year: 2026, carryOverMonths: 1 });
    const { holidays } = useHolidaysStore.getState();
    expect(holidays[0].date.getTime()).toBeLessThan(holidays[1].date.getTime());
  });
});

describe('removeHoliday', () => {
  it('removes the holiday with the given id', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01'), makeHoliday('h2', '2026-02-01')] });
    useHolidaysStore.getState().removeHoliday('h1');
    const { holidays } = useHolidaysStore.getState();
    expect(holidays).toHaveLength(1);
    expect(holidays[0].id).toBe('h2');
  });

  it('does nothing when id does not exist', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    useHolidaysStore.getState().removeHoliday('nonexistent');
    expect(useHolidaysStore.getState().holidays).toHaveLength(1);
  });
});

describe('editHoliday', () => {
  it('replaces the holiday at the matching index', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    const newDate = new Date('2026-03-15');
    useHolidaysStore.getState().editHoliday({ holidayId: 'h1', updates: { name: 'Renamed', date: newDate }, locale: 'en', year: 2026, carryOverMonths: 1 });
    const { holidays } = useHolidaysStore.getState();
    expect(holidays[0].name).toBe('Renamed');
    expect(holidays[0].date).toEqual(newDate);
  });

  it('does nothing when holidayId is not found', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    useHolidaysStore.getState().editHoliday({ holidayId: 'missing', updates: { name: 'X', date: new Date() }, locale: 'en', year: 2026, carryOverMonths: 1 });
    expect(useHolidaysStore.getState().holidays[0].id).toBe('h1');
  });
});

describe('setMaxAlternatives', () => {
  it('sets the value', () => {
    useHolidaysStore.getState().setMaxAlternatives(6);
    expect(useHolidaysStore.getState().maxAlternatives).toBe(6);
  });

  it('clamps to 0 for negative values', () => {
    useHolidaysStore.getState().setMaxAlternatives(-1);
    expect(useHolidaysStore.getState().maxAlternatives).toBe(0);
  });
});

describe('setCalculationResult', () => {
  it('stores suggestion and alternatives', () => {
    const suggestion = makeSuggestion([new Date('2026-05-01')]);
    const alternatives = [makeSuggestion([new Date('2026-06-01')])];
    useHolidaysStore.getState().setCalculationResult({ suggestion, alternatives });
    const state = useHolidaysStore.getState();
    expect(state.suggestion).toBe(suggestion);
    expect(state.alternatives).toEqual(alternatives);
    expect(state.currentSelection).toBe(suggestion);
    expect(state.removedSuggestedDays).toHaveLength(0);
  });

  it('preserves currentSelectionIndex within bounds', () => {
    const s1 = makeSuggestion([new Date('2026-05-01')]);
    const s2 = makeSuggestion([new Date('2026-06-01')]);
    useHolidaysStore.setState({ currentSelectionIndex: 1 });
    useHolidaysStore.getState().setCalculationResult({ suggestion: s1, alternatives: [s2] });
    expect(useHolidaysStore.getState().currentSelectionIndex).toBe(1);
    expect(useHolidaysStore.getState().currentSelection).toBe(s2);
  });

  it('resets to index 0 when previous index is out of bounds', () => {
    useHolidaysStore.setState({ currentSelectionIndex: 5 });
    const s = makeSuggestion([new Date('2026-05-01')]);
    useHolidaysStore.getState().setCalculationResult({ suggestion: s, alternatives: [] });
    expect(useHolidaysStore.getState().currentSelectionIndex).toBe(0);
  });
});

describe('getRemainingDays', () => {
  it('returns totalPtoDays minus active suggested and manual days', () => {
    const suggestion = makeSuggestion([new Date('2026-01-01'), new Date('2026-01-02')]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [new Date('2026-01-03')],
      removedSuggestedDays: [],
    });
    expect(useHolidaysStore.getState().getRemainingDays(10)).toBe(7);
  });

  it('counts removed suggested days as free', () => {
    const suggestion = makeSuggestion([new Date('2026-01-01'), new Date('2026-01-02')]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [new Date('2026-01-01')],
    });
    expect(useHolidaysStore.getState().getRemainingDays(5)).toBe(4);
  });

  it('returns 0 when no remaining days', () => {
    const suggestion = makeSuggestion([new Date('2026-01-01'), new Date('2026-01-02')]);
    useHolidaysStore.setState({ currentSelection: suggestion, manuallySelectedDays: [], removedSuggestedDays: [] });
    expect(useHolidaysStore.getState().getRemainingDays(2)).toBe(0);
  });
});

describe('getFreeDaysForMonth', () => {
  it('counts holidays in the given month that are in selected range', () => {
    useHolidaysStore.setState({
      holidays: [
        { ...makeHoliday('h1', '2026-05-01'), isInSelectedRange: true },
        { ...makeHoliday('h2', '2026-05-15'), isInSelectedRange: true },
        { ...makeHoliday('h3', '2026-06-01'), isInSelectedRange: true },
        { ...makeHoliday('h4', '2026-05-20'), isInSelectedRange: false },
      ],
    });
    expect(useHolidaysStore.getState().getFreeDaysForMonth(new Date('2026-05-01'))).toBe(2);
  });
});

describe('resetManualSelection', () => {
  it('clears manually selected and removed days', () => {
    useHolidaysStore.setState({
      manuallySelectedDays: [new Date('2026-01-03')],
      removedSuggestedDays: [new Date('2026-01-01')],
      currentSelection: null,
    });
    useHolidaysStore.getState().resetManualSelection();
    const state = useHolidaysStore.getState();
    expect(state.manuallySelectedDays).toHaveLength(0);
    expect(state.removedSuggestedDays).toHaveLength(0);
  });

  it('restores currentSelection to base when index is 0', () => {
    const suggestion = makeSuggestion([new Date('2026-01-01')]);
    const modified = { ...suggestion, metrics: { totalDays: 99 } as never };
    useHolidaysStore.setState({
      suggestion,
      alternatives: [],
      currentSelection: modified,
      currentSelectionIndex: 0,
      manuallySelectedDays: [],
      removedSuggestedDays: [],
    });
    useHolidaysStore.getState().resetManualSelection();
    expect(useHolidaysStore.getState().currentSelection).toBe(suggestion);
  });
});

describe('trimManualDays', () => {
  it('trims manuallySelectedDays to maxPtoDays', () => {
    useHolidaysStore.setState({
      manuallySelectedDays: [new Date('2026-01-01'), new Date('2026-01-02'), new Date('2026-01-03')],
    });
    useHolidaysStore.getState().trimManualDays(2);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(2);
  });

  it('does nothing when length is within limit', () => {
    useHolidaysStore.setState({
      manuallySelectedDays: [new Date('2026-01-01')],
    });
    useHolidaysStore.getState().trimManualDays(5);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
  });
});

describe('toggleDaySelection', () => {
  const baseDate = new Date('2026-05-10');
  const PARAMS = { totalPtoDays: 5, locale: 'en', allowPastDays: false };

  it('returns false when there is no currentSelection', () => {
    useHolidaysStore.setState({ currentSelection: null });
    expect(useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS })).toBe(false);
  });

  it('removes a day from manuallySelectedDays when already manually selected', () => {
    const suggestion = makeSuggestion([]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [baseDate],
      removedSuggestedDays: [],
    });
    const result = useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
    expect(result).toBe(true);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
  });

  it('re-adds a suggested day that was removed', () => {
    const suggestion = makeSuggestion([baseDate]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [baseDate],
    });
    useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
    expect(useHolidaysStore.getState().removedSuggestedDays).toHaveLength(0);
  });

  it('removes a suggested day that was not yet removed', () => {
    const suggestion = makeSuggestion([baseDate]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [],
    });
    useHolidaysStore.getState().toggleDaySelection({ date: baseDate, ...PARAMS });
    expect(useHolidaysStore.getState().removedSuggestedDays).toHaveLength(1);
  });

  it('returns false and does not add a day when no remaining budget', () => {
    const suggestion = makeSuggestion([new Date('2026-05-01'), new Date('2026-05-02'), new Date('2026-05-03'), new Date('2026-05-04'), new Date('2026-05-05')]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [],
    });
    const result = useHolidaysStore.getState().toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: 'en', allowPastDays: false });
    expect(result).toBe(false);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(0);
  });

  it('adds an unselected day when budget allows', () => {
    const suggestion = makeSuggestion([new Date('2026-05-01')]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [],
    });
    const result = useHolidaysStore.getState().toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: 'en', allowPastDays: false });
    expect(result).toBe(true);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
  });
});
