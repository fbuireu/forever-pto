import type { CalculateSuggestionsRequest } from './types';
import { WORKER_MESSAGE_TYPE } from './types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateSuggestions = vi.hoisted(() => vi.fn());
const mockGenerateAlternatives = vi.hoisted(() => vi.fn());
const mockGenerateMetrics = vi.hoisted(() => vi.fn());
const mockClearDateKeyCache = vi.hoisted(() => vi.fn());
const mockClearHolidayCache = vi.hoisted(() => vi.fn());
const mockPostMessage = vi.hoisted(() => vi.fn());

vi.mock('@domain/calendar/suggestions/generateSuggestions', () => ({ generateSuggestions: mockGenerateSuggestions }));
vi.mock('@domain/calendar/alternatives/generateAlternatives', () => ({ generateAlternatives: mockGenerateAlternatives }));
vi.mock('@domain/calendar/metrics/generateMetrics', () => ({ generateMetrics: mockGenerateMetrics }));
vi.mock('@domain/calendar/utils/cache', () => ({
  clearDateKeyCache: mockClearDateKeyCache,
  clearHolidayCache: mockClearHolidayCache,
}));

vi.stubGlobal('self', { postMessage: mockPostMessage });

await import('./worker');

const sendMessage = (payload: Partial<CalculateSuggestionsRequest['payload']> = {}) => {
  const message: CalculateSuggestionsRequest = {
    type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS,
    requestId: 'req-1',
    payload: {
      year: 2025,
      ptoDays: 5,
      holidays: [{ id: 'h-1', date: new Date(2025, 0, 1).toISOString(), name: 'New Year', variant: 'national', isInSelectedRange: true }],
      allowPastDays: false,
      months: [new Date(2025, 0, 1).toISOString()],
      strategy: 'grouped',
      locale: 'en',
      maxAlternatives: 3,
      manualDays: [],
      ...payload,
    },
  };
  (globalThis.onmessage as ((e: MessageEvent<CalculateSuggestionsRequest>) => void) | null)?.({ data: message } as MessageEvent<CalculateSuggestionsRequest>);
};

describe('worker onmessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateSuggestions.mockReturnValue({ days: [new Date(2025, 2, 10)], bridges: [] });
    mockGenerateAlternatives.mockReturnValue([]);
    mockGenerateMetrics.mockReturnValue({ efficiency: 2, totalDaysOff: 7 });
  });

  it('ignores messages with unknown type', () => {
    (globalThis.onmessage as ((e: MessageEvent) => void) | null)?.({ data: { type: 'UNKNOWN', requestId: 'r', payload: {} } } as MessageEvent);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('clears caches before processing', () => {
    sendMessage();
    expect(mockClearDateKeyCache).toHaveBeenCalled();
    expect(mockClearHolidayCache).toHaveBeenCalled();
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
    mockGenerateSuggestions.mockImplementation(() => { throw new Error('pipeline crash'); });
    sendMessage();
    const response = mockPostMessage.mock.calls[0][0];
    expect(response.type).toBe(WORKER_MESSAGE_TYPE.WORKER_ERROR);
    expect(response.requestId).toBe('req-1');
    expect(response.error).toContain('pipeline crash');
  });

  it('maps manualDays into pseudo-holidays with CUSTOM variant', () => {
    sendMessage({ manualDays: [new Date(2025, 2, 5).toISOString()] });
    const callArgs = mockGenerateSuggestions.mock.lastCall?.[0];
    const manualEntry = callArgs.holidays.find((h: { id: string }) => h.id === 'manual-0');
    expect(manualEntry).toBeDefined();
    expect(manualEntry.variant).toBe('custom');
  });

  it('respects autoSuggestCount over ptoDays when provided', () => {
    sendMessage({ ptoDays: 10, autoSuggestCount: 3 });
    const callArgs = mockGenerateSuggestions.mock.lastCall?.[0];
    expect(callArgs.ptoDays).toBe(3);
  });
});
