import { type CalculateSuggestionsRequest, WORKER_MESSAGE_TYPE } from '@infrastructure/workers/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetCalculating = vi.hoisted(() => vi.fn());
const mockSetCalculationResult = vi.hoisted(() => vi.fn());
const storeState = vi.hoisted(() => ({
  manuallySelectedDays: [] as Date[],
  removedSuggestedDays: [] as Date[],
  currentSelection: null as { days: Date[] } | null,
  holidays: [] as never[],
  maxAlternatives: 3,
}));
const mockGetState = vi.hoisted(() =>
  vi.fn(() => ({
    removedSuggestedDays: storeState.removedSuggestedDays,
    currentSelection: storeState.currentSelection,
    manuallySelectedDays: storeState.manuallySelectedDays,
    setCalculating: mockSetCalculating,
  }))
);

vi.mock('@application/stores/holidays', () => ({
  useHolidaysStore: Object.assign(
    vi.fn((selector: (state: unknown) => unknown) =>
      selector({
        setCalculating: mockSetCalculating,
        setCalculationResult: mockSetCalculationResult,
        holidays: storeState.holidays,
        maxAlternatives: storeState.maxAlternatives,
        manuallySelectedDays: storeState.manuallySelectedDays,
        removedSuggestedDays: storeState.removedSuggestedDays,
        currentSelection: storeState.currentSelection,
      })
    ),
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
  onmessageerror: (() => void) | null;
} = {
  postMessage: mockPostMessage,
  terminate: mockTerminate,
  onmessage: null,
  onerror: null,
  onmessageerror: null,
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

const MANUAL_DAYS = [new Date(2025, 1, 10), new Date(2025, 1, 11)];
const REMOVED_DAY = new Date(2025, 3, 7);
const SUGGESTED_DAYS = [new Date(2025, 3, 7), new Date(2025, 3, 8), new Date(2025, 3, 9)];

const lastRequest = (): CalculateSuggestionsRequest => {
  const [request] = mockPostMessage.mock.lastCall ?? [];
  if (!request) throw new Error('the worker was never posted a request');
  return request as CalculateSuggestionsRequest;
};

const lastPayload = () => lastRequest().payload;

const deliverResult = () => {
  act(() => {
    workerInstance.onmessage?.({
      data: {
        type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT,
        requestId: lastRequest().requestId,
        payload: { suggestion: { days: [], bridges: [] }, alternatives: [] },
      },
    } as MessageEvent);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  workerInstance.onmessage = null;
  workerInstance.onerror = null;
  workerInstance.onmessageerror = null;
  storeState.manuallySelectedDays = [];
  storeState.removedSuggestedDays = [];
  storeState.currentSelection = null;
});

describe('useCalculationsWorker caps only to protect Removed Days', () => {
  it('sends no cap when nothing was removed, so an applied plan is re-planned at full budget', () => {
    storeState.currentSelection = { days: [new Date(2025, 0, 6), new Date(2025, 0, 7)] };
    storeState.removedSuggestedDays = [];

    const { result } = renderHook(() => useCalculationsWorker());
    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().autoSuggestCount).toBeUndefined();
  });

  it('still caps at the surviving Suggested Days when the user removed some', () => {
    storeState.currentSelection = { days: [new Date(2025, 0, 6), new Date(2025, 0, 7), new Date(2025, 0, 8)] };
    storeState.removedSuggestedDays = [new Date(2025, 0, 8)];

    const { result } = renderHook(() => useCalculationsWorker());
    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().autoSuggestCount).toBe(2);
  });
});

describe('useCalculationsWorker', () => {
  it('keeps triggerCalculation stable when only the hand-picked days change, so editing one day never re-plans the year', () => {
    const { result, rerender } = renderHook(() => useCalculationsWorker());
    const before = result.current.triggerCalculation;

    storeState.manuallySelectedDays = MANUAL_DAYS;
    rerender();

    expect(result.current.triggerCalculation).toBe(before);
  });

  it('still reads the hand-picked days set after mount, so a stale identity never sends a stale budget', () => {
    const { result, rerender } = renderHook(() => useCalculationsWorker());

    storeState.manuallySelectedDays = MANUAL_DAYS;
    rerender();
    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().manualDays).toEqual(MANUAL_DAYS.map((d) => d.toISOString()));
  });

  it('returns a triggerCalculation function', () => {
    const { result } = renderHook(() => useCalculationsWorker());
    expect(typeof result.current.triggerCalculation).toBe('function');
  });

  it('sets calculating to true when a request starts', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(mockSetCalculating).toHaveBeenCalledWith(true);
  });

  it('terminates the previous worker before starting a new one', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(mockTerminate).toHaveBeenCalled();
  });

  it('posts the calculation request to the worker', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS, payload: expect.any(Object) })
    );
  });

  it('sends the manual and removed days in the payload', () => {
    storeState.manuallySelectedDays = MANUAL_DAYS;
    storeState.removedSuggestedDays = [REMOVED_DAY];
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().manualDays).toEqual(MANUAL_DAYS.map((d) => d.toISOString()));
    expect(lastPayload().removedDays).toEqual([REMOVED_DAY.toISOString()]);
  });

  it('caps autoSuggestCount to the days still active in the current selection', () => {
    storeState.manuallySelectedDays = MANUAL_DAYS;
    storeState.removedSuggestedDays = [REMOVED_DAY];
    storeState.currentSelection = { days: SUGGESTED_DAYS };
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().autoSuggestCount).toBe(
      Math.min(BASE_PARAMS.ptoDays - MANUAL_DAYS.length, SUGGESTED_DAYS.length - 1)
    );
  });

  it('sends no autoSuggestCount when there is no current selection', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().autoSuggestCount).toBeUndefined();
  });

  it('sends no autoSuggestCount when every suggested day has been removed', () => {
    storeState.currentSelection = { days: SUGGESTED_DAYS };
    storeState.removedSuggestedDays = SUGGESTED_DAYS;
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    expect(lastPayload().autoSuggestCount).toBeUndefined();
  });

  it('sends no autoSuggestCount when ptoDays changed since the last completed run', () => {
    storeState.currentSelection = { days: SUGGESTED_DAYS };
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    deliverResult();
    act(() => {
      result.current.triggerCalculation({ ...BASE_PARAMS, ptoDays: BASE_PARAMS.ptoDays + 3 });
    });

    expect(lastPayload().autoSuggestCount).toBeUndefined();
  });

  it('calls setCalculationResult and clears calculating on a successful response', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

    const requestId = lastRequest().requestId;

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

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });

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

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    act(() => {
      workerInstance.onerror?.();
    });

    expect(mockSetCalculating).toHaveBeenCalledWith(false);
  });

  it('clears calculating when the response cannot be deserialized', () => {
    const { result } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    act(() => {
      workerInstance.onmessageerror?.();
    });

    expect(mockSetCalculating).toHaveBeenLastCalledWith(false);
  });

  it('terminates the worker on unmount', () => {
    const { result, unmount } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    unmount();

    expect(mockTerminate).toHaveBeenCalled();
  });

  it('clears calculating when unmounted with a request in flight', () => {
    const { result, unmount } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    unmount();

    expect(mockSetCalculating).toHaveBeenLastCalledWith(false);
  });

  it('leaves calculating alone when unmounted with no request in flight', () => {
    const { result, unmount } = renderHook(() => useCalculationsWorker());

    act(() => {
      result.current.triggerCalculation(BASE_PARAMS);
    });
    deliverResult();
    mockSetCalculating.mockClear();
    unmount();

    expect(mockSetCalculating).not.toHaveBeenCalled();
  });
});
