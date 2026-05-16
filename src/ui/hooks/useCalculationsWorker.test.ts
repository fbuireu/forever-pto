import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKER_MESSAGE_TYPE } from '@infrastructure/workers/types';

const mockSetCalculating = vi.hoisted(() => vi.fn());
const mockSetCalculationResult = vi.hoisted(() => vi.fn());
const mockGetState = vi.hoisted(() => vi.fn(() => ({ removedSuggestedDays: [], currentSelection: null })));

vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: Object.assign(
    vi.fn(() => ({
      setCalculating: mockSetCalculating,
      setCalculationResult: mockSetCalculationResult,
      holidays: [],
      maxAlternatives: 3,
      manuallySelectedDays: [],
    })),
    { getState: mockGetState }
  ),
}));

vi.mock('@infrastructure/workers/utils/serializers', () => ({
  serializeHolidays: vi.fn(() => []),
  serializeMonths: vi.fn((months: Date[]) => months.map((m) => m.toISOString())),
  deserializeSuggestion: vi.fn((s: unknown) => s),
}));

const mockPostMessage = vi.fn();
const mockTerminate = vi.fn();

const workerInstance: {
  postMessage: typeof mockPostMessage;
  terminate: typeof mockTerminate;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: (() => void) | null;
} = {
  postMessage: mockPostMessage,
  terminate: mockTerminate,
  onmessage: null,
  onerror: null,
};

function MockWorker() {
  return workerInstance;
}

vi.stubGlobal('Worker', MockWorker);

const { useCalculationsWorker } = await import('./useCalculationsWorker');

const BASE_PARAMS = {
  year: 2025,
  ptoDays: 5,
  allowPastDays: false,
  months: [new Date(2025, 0, 1)],
  strategy: 'grouped' as const,
  locale: 'en',
};

beforeEach(() => {
  vi.clearAllMocks();
  workerInstance.onmessage = null;
  workerInstance.onerror = null;
});

describe('useCalculationsWorker', () => {
  it('returns a triggerCalculation function', () => {
    const { result } = renderHook(() => useCalculationsWorker());
    expect(typeof result.current.triggerCalculation).toBe('function');
  });

  it('sets calculating to true when a request starts', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });

    expect(mockSetCalculating).toHaveBeenCalledWith(true);
  });

  it('terminates the previous worker before starting a new one', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });
    act(() => { result.current.triggerCalculation(BASE_PARAMS); });

    expect(mockTerminate).toHaveBeenCalled();
  });

  it('posts the calculation request to the worker', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS, payload: expect.any(Object) })
    );
  });

  it('calls setCalculationResult and clears calculating on a successful response', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });

    const requestId = (mockPostMessage.mock.lastCall![0] as { requestId: string }).requestId;

    act(() => {
      workerInstance.onmessage?.({
        data: {
          type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT,
          requestId,
          payload: { suggestion: { days: [], bridges: [] }, alternatives: [] },
        },
      } as MessageEvent);
    });

    expect(mockSetCalculating).toHaveBeenCalledWith(false);
    expect(mockSetCalculationResult).toHaveBeenCalled();
  });

  it('ignores responses with a stale requestId', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });

    act(() => {
      workerInstance.onmessage?.({
        data: {
          type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT,
          requestId: 'stale-id',
          payload: { suggestion: { days: [], bridges: [] }, alternatives: [] },
        },
      } as MessageEvent);
    });

    expect(mockSetCalculationResult).not.toHaveBeenCalled();
  });

  it('clears calculating on worker error', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });
    act(() => { workerInstance.onerror?.(); });

    expect(mockSetCalculating).toHaveBeenCalledWith(false);
  });

  it('terminates the worker on unmount', () => {
    const { result, unmount } = renderHook(() => useCalculationsWorker());

    act(() => { result.current.triggerCalculation(BASE_PARAMS); });
    unmount();

    expect(mockTerminate).toHaveBeenCalled();
  });
});
