import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const makeStoreMock = (hydrated: boolean) => {
  const listeners: (() => void)[] = [];
  return {
    persist: {
      hasHydrated: vi.fn(() => hydrated),
      onFinishHydration: vi.fn((cb: () => void) => {
        listeners.push(cb);
        return () => {};
      }),
    },
    _finish: () => listeners.forEach((cb) => { cb(); }),
  };
};

const filtersStore = makeStoreMock(false);
const holidaysStore = makeStoreMock(false);
const locationStore = makeStoreMock(false);
const premiumStore = makeStoreMock(false);

vi.mock('@application/stores/filters', () => ({ useFiltersStore: filtersStore }));
vi.mock('@application/stores/holidays', () => ({ useHolidaysStore: holidaysStore }));
vi.mock('@application/stores/location', () => ({ useLocationStore: locationStore }));
vi.mock('@application/stores/premium', () => ({ usePremiumStore: premiumStore }));

const { useStoresReady } = await import('./useStoresReady');

describe('useStoresReady', () => {
  it('reports not ready when no stores have hydrated', () => {
    const { result } = renderHook(() => useStoresReady());
    expect(result.current.areStoresReady).toBe(false);
  });

  it('reports ready when all stores were already hydrated at mount', async () => {
    filtersStore.persist.hasHydrated.mockReturnValue(true);
    holidaysStore.persist.hasHydrated.mockReturnValue(true);
    locationStore.persist.hasHydrated.mockReturnValue(true);
    premiumStore.persist.hasHydrated.mockReturnValue(true);

    const { result } = renderHook(() => useStoresReady());
    expect(result.current.areStoresReady).toBe(true);

    filtersStore.persist.hasHydrated.mockReturnValue(false);
    holidaysStore.persist.hasHydrated.mockReturnValue(false);
    locationStore.persist.hasHydrated.mockReturnValue(false);
    premiumStore.persist.hasHydrated.mockReturnValue(false);
  });

  it('becomes ready after all stores finish hydration', () => {
    const { result } = renderHook(() => useStoresReady());

    expect(result.current.areStoresReady).toBe(false);

    act(() => {
      filtersStore._finish();
      holidaysStore._finish();
      locationStore._finish();
      premiumStore._finish();
    });

    expect(result.current.areStoresReady).toBe(true);
  });

  it('exposes per-store hydration status', () => {
    const { result } = renderHook(() => useStoresReady());
    expect(result.current.hydrationStatus).toMatchObject({
      filters: false,
      holidays: false,
      location: false,
      premium: false,
    });
  });

  it('registers hydration listeners for pending stores', () => {
    renderHook(() => useStoresReady());
    expect(filtersStore.persist.onFinishHydration).toHaveBeenCalled();
    expect(holidaysStore.persist.onFinishHydration).toHaveBeenCalled();
    expect(locationStore.persist.onFinishHydration).toHaveBeenCalled();
    expect(premiumStore.persist.onFinishHydration).toHaveBeenCalled();
  });
});
