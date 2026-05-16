import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { FilterStrategy, type Suggestion } from '@domain/calendar/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHolidaysStore } from './holidays';

const { mockGetHolidays, mockGenerateSuggestionsImpl, mockGenerateAlternativesImpl } = vi.hoisted(() => ({
  mockGetHolidays: vi.fn().mockResolvedValue([]),
  mockGenerateSuggestionsImpl: vi.fn().mockReturnValue({ days: [], bridges: [] }),
  mockGenerateAlternativesImpl: vi.fn().mockReturnValue([]),
}));

vi.mock('@infrastructure/services/holidays/getHolidays', () => ({
  getHolidays: mockGetHolidays,
}));
vi.mock('@domain/calendar/suggestions/generateSuggestions', () => ({
  generateSuggestions: mockGenerateSuggestionsImpl,
}));
vi.mock('@domain/calendar/alternatives/generateAlternatives', () => ({
  generateAlternatives: mockGenerateAlternativesImpl,
}));

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

vi.mock('@domain/calendar/metrics/generateMetrics', () => ({
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
    useHolidaysStore.getState().addHoliday({
      holiday: { name: 'New Year', date, type: 'public' },
      locale: 'en',
      year: 2026,
      carryOverMonths: 1,
    });
    expect(useHolidaysStore.getState().holidays).toHaveLength(1);
    expect(useHolidaysStore.getState().holidays[0].name).toBe('New Year');
  });

  it('does not add a holiday when one already exists on the same date', () => {
    const date = new Date('2026-01-01');
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    useHolidaysStore.getState().addHoliday({
      holiday: { name: 'Duplicate', date, type: 'public' },
      locale: 'en',
      year: 2026,
      carryOverMonths: 1,
    });
    expect(useHolidaysStore.getState().holidays).toHaveLength(1);
  });

  it('sorts holidays by date after adding', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-06-01')] });
    const earlyDate = new Date('2026-01-15');
    useHolidaysStore.getState().addHoliday({
      holiday: { name: 'Early', date: earlyDate, type: 'public' },
      locale: 'en',
      year: 2026,
      carryOverMonths: 1,
    });
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
    useHolidaysStore.getState().editHoliday({
      holidayId: 'h1',
      updates: { name: 'Renamed', date: newDate },
      locale: 'en',
      year: 2026,
      carryOverMonths: 1,
    });
    const { holidays } = useHolidaysStore.getState();
    expect(holidays[0].name).toBe('Renamed');
    expect(holidays[0].date).toEqual(newDate);
  });

  it('does nothing when holidayId is not found', () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')] });
    useHolidaysStore.getState().editHoliday({
      holidayId: 'missing',
      updates: { name: 'X', date: new Date() },
      locale: 'en',
      year: 2026,
      carryOverMonths: 1,
    });
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
    const suggestion = makeSuggestion([
      new Date('2026-05-01'),
      new Date('2026-05-02'),
      new Date('2026-05-03'),
      new Date('2026-05-04'),
      new Date('2026-05-05'),
    ]);
    useHolidaysStore.setState({
      currentSelection: suggestion,
      manuallySelectedDays: [],
      removedSuggestedDays: [],
    });
    const result = useHolidaysStore
      .getState()
      .toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: 'en', allowPastDays: false });
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
    const result = useHolidaysStore
      .getState()
      .toggleDaySelection({ date: baseDate, totalPtoDays: 5, locale: 'en', allowPastDays: false });
    expect(result).toBe(true);
    expect(useHolidaysStore.getState().manuallySelectedDays).toHaveLength(1);
  });
});

describe('setCalculating', () => {
  it('sets isCalculating to true', () => {
    useHolidaysStore.getState().setCalculating(true);
    expect(useHolidaysStore.getState().isCalculating).toBe(true);
  });

  it('sets isCalculating to false', () => {
    useHolidaysStore.setState({ isCalculating: true });
    useHolidaysStore.getState().setCalculating(false);
    expect(useHolidaysStore.getState().isCalculating).toBe(false);
  });
});

describe('setCurrentAlternativeSelection', () => {
  it('sets currentSelection, previewAlternativeSelection and index', () => {
    const suggestion = makeSuggestion([new Date('2026-06-01')]);
    useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion, index: 2 });
    const state = useHolidaysStore.getState();
    expect(state.currentSelection).toBe(suggestion);
    expect(state.currentSelectionIndex).toBe(2);
    expect(state.previewAlternativeSelection).toBe(suggestion);
    expect(state.previewAlternativeIndex).toBe(2);
  });

  it('resets manuallySelectedDays and removedSuggestedDays', () => {
    useHolidaysStore.setState({
      manuallySelectedDays: [new Date('2026-01-05')],
      removedSuggestedDays: [new Date('2026-01-06')],
    });
    useHolidaysStore.getState().setCurrentAlternativeSelection({ suggestion: makeSuggestion([]), index: 0 });
    const state = useHolidaysStore.getState();
    expect(state.manuallySelectedDays).toHaveLength(0);
    expect(state.removedSuggestedDays).toHaveLength(0);
  });
});

describe('setPreviewAlternativeSelection', () => {
  it('sets previewAlternativeSelection and previewAlternativeIndex', () => {
    const suggestion = makeSuggestion([new Date('2026-08-01')]);
    useHolidaysStore.getState().setPreviewAlternativeSelection({ suggestion, index: 1 });
    const state = useHolidaysStore.getState();
    expect(state.previewAlternativeSelection).toBe(suggestion);
    expect(state.previewAlternativeIndex).toBe(1);
  });

  it('does not modify currentSelection or manuallySelectedDays', () => {
    const currentSuggestion = makeSuggestion([new Date('2026-05-01')]);
    useHolidaysStore.setState({
      currentSelection: currentSuggestion,
      manuallySelectedDays: [new Date('2026-01-10')],
    });
    useHolidaysStore.getState().setPreviewAlternativeSelection({ suggestion: makeSuggestion([new Date('2026-08-01')]), index: 1 });
    const state = useHolidaysStore.getState();
    expect(state.currentSelection).toBe(currentSuggestion);
    expect(state.manuallySelectedDays).toHaveLength(1);
  });
});

describe('resetToDefaults', () => {
  it('resets all state to initial values', () => {
    useHolidaysStore.setState({
      holidays: [makeHoliday('h1', '2026-01-01')],
      maxAlternatives: 8,
      isCalculating: true,
      manuallySelectedDays: [new Date('2026-01-05')],
      currentSelectionIndex: 3,
      suggestion: makeSuggestion([new Date('2026-05-01')]),
    });
    useHolidaysStore.getState().resetToDefaults();
    const state = useHolidaysStore.getState();
    expect(state.holidays).toHaveLength(0);
    expect(state.maxAlternatives).toBe(4);
    expect(state.isCalculating).toBe(false);
    expect(state.manuallySelectedDays).toHaveLength(0);
    expect(state.currentSelectionIndex).toBe(0);
    expect(state.suggestion).toBeNull();
    expect(state.currentSelection).toBeNull();
    expect(state.alternatives).toHaveLength(0);
  });
});

describe('fetchHolidays', () => {
  const FETCH_PARAMS = { year: 2026, country: 'ES', region: '', carryOverMonths: 1, locale: 'en' as const };

  it('sets fetched holidays sorted by date', async () => {
    const h1 = makeHoliday('h1', '2026-06-01');
    const h2 = makeHoliday('h2', '2026-01-15');
    mockGetHolidays.mockResolvedValueOnce([h1, h2]);
    await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
    const { holidays } = useHolidaysStore.getState();
    expect(holidays).toHaveLength(2);
    expect(holidays[0].date.getTime()).toBeLessThan(holidays[1].date.getTime());
  });

  it('preserves custom holidays and drops fetched holidays with the same date', async () => {
    const custom = makeHoliday('custom-1', '2026-05-01', HolidayVariant.CUSTOM);
    const duplicate = makeHoliday('fetched-1', '2026-05-01');
    const other = makeHoliday('fetched-2', '2026-06-01');
    useHolidaysStore.setState({ holidays: [custom] });
    mockGetHolidays.mockResolvedValueOnce([duplicate, other]);
    await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
    const { holidays } = useHolidaysStore.getState();
    expect(holidays).toHaveLength(2);
    expect(holidays.find((h) => h.id === 'custom-1')).toBeDefined();
    expect(holidays.find((h) => h.id === 'fetched-1')).toBeUndefined();
  });

  it('sets holidays to empty and logs on error', async () => {
    mockGetHolidays.mockRejectedValueOnce(new Error('network error'));
    await useHolidaysStore.getState().fetchHolidays(FETCH_PARAMS);
    expect(useHolidaysStore.getState().holidays).toHaveLength(0);
  });
});

describe('generateSuggestions', () => {
  const PARAMS = {
    year: 2026,
    ptoDays: 5,
    allowPastDays: false,
    months: [] as Date[],
    strategy: FilterStrategy.GROUPED,
    locale: 'en' as const,
  };

  it('clears suggestions when ptoDays is 0', async () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion: makeSuggestion([]) });
    await useHolidaysStore.getState().generateSuggestions({ ...PARAMS, ptoDays: 0 });
    expect(useHolidaysStore.getState().suggestion).toBeNull();
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });

  it('clears suggestions when holidays list is empty', async () => {
    useHolidaysStore.setState({ holidays: [], suggestion: makeSuggestion([]) });
    await useHolidaysStore.getState().generateSuggestions(PARAMS);
    expect(useHolidaysStore.getState().suggestion).toBeNull();
  });

  it('sets suggestion, alternatives, and currentSelection on success', async () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], maxAlternatives: 1 });
    const days = [new Date('2026-06-01')];
    mockGenerateSuggestionsImpl.mockReturnValueOnce({ days, bridges: [] });
    mockGenerateAlternativesImpl.mockReturnValueOnce([{ days: [new Date('2026-07-01')], bridges: [] }]);
    await useHolidaysStore.getState().generateSuggestions(PARAMS);
    const state = useHolidaysStore.getState();
    expect(state.suggestion).toMatchObject({ days });
    expect(state.alternatives).toHaveLength(1);
    expect(state.currentSelection).toBe(state.suggestion);
    expect(state.currentSelectionIndex).toBe(0);
    expect(state.previewAlternativeIndex).toBe(0);
  });

  it('clears suggestions on error', async () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion: makeSuggestion([]) });
    mockGenerateSuggestionsImpl.mockImplementationOnce(() => {
      throw new Error('calc error');
    });
    await useHolidaysStore.getState().generateSuggestions(PARAMS);
    expect(useHolidaysStore.getState().suggestion).toBeNull();
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });
});

describe('generateAlternatives', () => {
  const PARAMS = {
    year: 2026,
    ptoDays: 5,
    allowPastDays: false,
    months: [] as Date[],
    strategy: FilterStrategy.GROUPED,
    locale: 'en' as const,
  };

  it('sets alternatives to empty when ptoDays is 0', async () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion: makeSuggestion([]) });
    await useHolidaysStore.getState().generateAlternatives({ ...PARAMS, ptoDays: 0 });
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });

  it('sets alternatives to empty when holidays list is empty', async () => {
    useHolidaysStore.setState({ holidays: [], suggestion: makeSuggestion([]) });
    await useHolidaysStore.getState().generateAlternatives(PARAMS);
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });

  it('sets alternatives to empty when maxAlternatives resolves to 0', async () => {
    useHolidaysStore.setState({
      holidays: [makeHoliday('h1', '2026-01-01')],
      suggestion: makeSuggestion([]),
      maxAlternatives: 0,
    });
    await useHolidaysStore.getState().generateAlternatives(PARAMS);
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });

  it('sets alternatives to empty when there is no base suggestion', async () => {
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion: null });
    await useHolidaysStore.getState().generateAlternatives(PARAMS);
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });

  it('sets alternatives on success', async () => {
    const suggestion = makeSuggestion([new Date('2026-05-01')]);
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion, maxAlternatives: 2 });
    mockGenerateAlternativesImpl.mockReturnValueOnce([{ days: [new Date('2026-07-01')], bridges: [] }]);
    await useHolidaysStore.getState().generateAlternatives(PARAMS);
    expect(useHolidaysStore.getState().alternatives).toHaveLength(1);
  });

  it('sets alternatives to empty on error', async () => {
    const suggestion = makeSuggestion([new Date('2026-05-01')]);
    useHolidaysStore.setState({ holidays: [makeHoliday('h1', '2026-01-01')], suggestion, maxAlternatives: 2 });
    mockGenerateAlternativesImpl.mockImplementationOnce(() => {
      throw new Error('alt error');
    });
    await useHolidaysStore.getState().generateAlternatives(PARAMS);
    expect(useHolidaysStore.getState().alternatives).toHaveLength(0);
  });
});
