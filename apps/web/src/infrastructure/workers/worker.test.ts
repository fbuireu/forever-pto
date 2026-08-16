import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalculateSuggestionsRequest } from './types';
import { WORKER_MESSAGE_TYPE } from './types';

const mockFindPlanningCandidates = vi.hoisted(() => vi.fn());
const mockGenerateSuggestions = vi.hoisted(() => vi.fn());
const mockGenerateAlternatives = vi.hoisted(() => vi.fn());
const mockGenerateMetrics = vi.hoisted(() => vi.fn());
const mockPostMessage = vi.hoisted(() => vi.fn());

vi.mock('@domain/calendar/utils/candidates', () => ({ findPlanningCandidates: mockFindPlanningCandidates }));
vi.mock('@domain/calendar/suggestions/generateSuggestions', () => ({ generateSuggestions: mockGenerateSuggestions }));
vi.mock('@domain/calendar/alternatives/generateAlternatives', () => ({
  generateAlternatives: mockGenerateAlternatives,
}));
vi.mock('@domain/calendar/metrics/generateMetrics', () => ({ generateMetrics: mockGenerateMetrics }));

vi.stubGlobal('self', { postMessage: mockPostMessage });

await import('./worker');

const sendMessage = (payload: Partial<CalculateSuggestionsRequest['payload']> = {}) => {
  const message: CalculateSuggestionsRequest = {
    type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS,
    requestId: 'req-1',
    payload: {
      year: 2025,
      ptoDays: 5,
      holidays: [
        {
          id: 'h-1',
          date: new Date(2025, 0, 1).toISOString(),
          name: 'New Year',
          variant: 'national',
          isInSelectedRange: true,
        },
      ],
      allowPastDays: false,
      months: [new Date(2025, 0, 1).toISOString()],
      strategy: 'grouped',
      locale: 'en',
      maxAlternatives: 3,
      manualDays: [],
      ...payload,
    },
  };
  (globalThis.onmessage as ((e: MessageEvent<CalculateSuggestionsRequest>) => void) | null)?.({
    data: message,
  } as MessageEvent<CalculateSuggestionsRequest>);
};

describe('worker onmessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindPlanningCandidates.mockReturnValue({ availableWorkdays: [], bridges: [] });
    mockGenerateSuggestions.mockReturnValue({ days: [new Date(2025, 2, 10)], bridges: [] });
    mockGenerateAlternatives.mockReturnValue([]);
    mockGenerateMetrics.mockReturnValue({ efficiency: 2, totalDaysOff: 7 });
  });

  it('ignores messages with unknown type', () => {
    (globalThis.onmessage as ((e: MessageEvent) => void) | null)?.({
      data: { type: 'UNKNOWN', requestId: 'r', payload: {} },
    } as MessageEvent);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('posts CALCULATE_SUGGESTIONS_RESULT on success', () => {
    sendMessage();
    expect(mockPostMessage).toHaveBeenCalledOnce();
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
    expect(response.requestId).toBe('req-1');
  });

  it('serializes suggestion days to ISO strings in the response', () => {
    sendMessage();
    const response = mockPostMessage.mock.calls[0][0];
    expect(typeof response.payload.suggestion.days[0]).toBe('string');
  });

  it('passes a recognised strategy through to both generators', () => {
    sendMessage({ strategy: 'optimized' });
    expect(mockGenerateSuggestions).toHaveBeenCalledWith(expect.objectContaining({ strategy: 'optimized' }));
    expect(mockGenerateAlternatives).toHaveBeenCalledWith(expect.objectContaining({ strategy: 'optimized' }));
  });

  it('replaces an unrecognised strategy with the default, so the two generators cannot disagree', () => {
    sendMessage({ strategy: 'balanced-ish' as never });
    expect(mockGenerateSuggestions).toHaveBeenCalledWith(expect.objectContaining({ strategy: 'grouped' }));
    expect(mockGenerateAlternatives).toHaveBeenCalledWith(expect.objectContaining({ strategy: 'grouped' }));
  });

  it('posts an empty result when effectivePtoDays is 0', () => {
    sendMessage({ ptoDays: 0 });
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
    expect(response.payload.suggestion.days).toEqual([]);
  });

  it('posts an empty result when holidays list is empty', () => {
    sendMessage({ holidays: [], manualDays: [] });
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
    expect(response.payload.suggestion.days).toEqual([]);
  });

  it('posts WORKER_ERROR when pipeline throws', () => {
    mockGenerateSuggestions.mockImplementation(() => {
      throw new Error('pipeline crash');
    });
    sendMessage();
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.WORKER_ERROR);
    expect(response.requestId).toBe('req-1');
    expect(response.error).toContain('pipeline crash');
  });

  it('maps manualDays into pseudo-holidays with CUSTOM variant', () => {
    sendMessage({ manualDays: [new Date(2025, 2, 5).toISOString()] });
    const callArgs = mockFindPlanningCandidates.mock.lastCall?.[0];
    const manualEntry = callArgs.holidays.find((h: { id: string }) => h.id === 'manual-0');
    expect(manualEntry).toBeDefined();
    expect(manualEntry.variant).toBe('custom');
  });

  it('respects autoSuggestCount over ptoDays when provided', () => {
    sendMessage({ ptoDays: 10, autoSuggestCount: 3 });
    const callArgs = mockGenerateSuggestions.mock.lastCall?.[0];
    expect(callArgs.ptoDays).toBe(3);
  });

  it('hands removedDays to the planner as dates, never as holidays', () => {
    const removed = new Date(2025, 2, 20);
    sendMessage({ removedDays: [removed.toISOString()] });
    const carriesRemovedDay = (holidays: { date: Date }[]) =>
      holidays.some((h) => h.date.toDateString() === removed.toDateString());

    const candidateArgs = mockFindPlanningCandidates.mock.lastCall?.[0];
    expect(candidateArgs.removedDays).toEqual([removed]);
    expect(carriesRemovedDay(candidateArgs.holidays)).toBe(false);
  });

  it('keeps removedDays out of the metrics holidays, since they are days the user works', () => {
    sendMessage({
      removedDays: [new Date(2025, 2, 20).toISOString()],
      manualDays: [new Date(2025, 2, 5).toISOString()],
    });
    const metricsHolidays = mockGenerateMetrics.mock.lastCall?.[0].holidays;
    const removed = new Date(2025, 2, 20);
    expect(metricsHolidays.some((h: { date: Date }) => h.date.toDateString() === removed.toDateString())).toBe(false);
    expect(metricsHolidays.some((h: { id: string }) => h.id === 'manual-0')).toBe(true);
  });

  it('measures the metrics against the Manual Days too, not just the days it placed itself', () => {
    const manual = new Date(2025, 2, 5);
    const removed = new Date(2025, 2, 20);
    sendMessage({ manualDays: [manual.toISOString()], removedDays: [removed.toISOString()] });

    const metricsArgs = mockGenerateMetrics.mock.lastCall?.[0];
    expect(metricsArgs.manuallySelectedDays.map((d: Date) => d.toDateString())).toEqual([manual.toDateString()]);
    expect(metricsArgs.removedSuggestedDays.map((d: Date) => d.toDateString())).toEqual([removed.toDateString()]);
  });

  it('gives the alternatives the same day set as the base suggestion, so their metrics stay comparable', () => {
    const manual = new Date(2025, 2, 5);
    sendMessage({ manualDays: [manual.toISOString()] });

    const everyCall = mockGenerateMetrics.mock.calls.map(([args]) => args.manuallySelectedDays);
    expect(everyCall.length).toBeGreaterThan(0);
    for (const days of everyCall) {
      expect(days.map((d: Date) => d.toDateString())).toEqual([manual.toDateString()]);
    }
  });

  it('scopes the metrics to the requested year, not the 2025 the mocked suggestion would infer', () => {
    sendMessage({ year: 2026 });
    expect(mockGenerateMetrics.mock.lastCall?.[0].year).toBe(2026);
  });

  it('short-circuits when the only blocked dates are Removed Days', () => {
    sendMessage({ holidays: [], manualDays: [], removedDays: [new Date(2025, 2, 20).toISOString()] });
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
    expect(response.payload.suggestion.days).toEqual([]);
  });

  it('deducts manualDays from the budget when no autoSuggestCount is given', () => {
    sendMessage({ ptoDays: 10, manualDays: [new Date(2025, 2, 5).toISOString(), new Date(2025, 2, 6).toISOString()] });
    expect(mockGenerateSuggestions.mock.lastCall?.[0].ptoDays).toBe(8);
    expect(mockGenerateAlternatives.mock.lastCall?.[0].ptoDays).toBe(8);
  });

  it('derives the empty result Metrics from the engine rather than a hand-written constant', () => {
    sendMessage({ ptoDays: 0 });
    const { metrics } = mockPostMessage.mock.calls[0][0].payload.suggestion;

    expect(mockGenerateMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ suggestion: expect.objectContaining({ days: [], bridges: [] }) })
    );
    expect(metrics).toEqual(mockGenerateMetrics.mock.results[0]?.value);
  });

  it('posts an empty result when manualDays exceed the budget', () => {
    sendMessage({
      ptoDays: 2,
      manualDays: [
        new Date(2025, 2, 5).toISOString(),
        new Date(2025, 2, 6).toISOString(),
        new Date(2025, 2, 7).toISOString(),
      ],
    });
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
    expect(response.payload.suggestion.days).toEqual([]);
  });
});
