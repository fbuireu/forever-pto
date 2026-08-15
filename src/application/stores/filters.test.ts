import { FilterStrategy } from '@domain/calendar/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MIN_PTO_DAYS, useFiltersStore } from './filters';

const { mockLogError, mockWarn } = vi.hoisted(() => ({ mockLogError: vi.fn(), mockWarn: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError, warn: mockWarn }),
}));

const { mockStorageGetItem } = vi.hoisted(() => ({ mockStorageGetItem: vi.fn().mockResolvedValue(null) }));

vi.mock('./crypto', () => ({
  obfuscatedStorage: {
    getItem: mockStorageGetItem,
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const INITIAL = {
  ptoDays: 22,
  allowPastDays: false,
  country: '',
  region: '',
  year: new Date().getFullYear(),
  carryOverMonths: 1,
  strategy: FilterStrategy.GROUPED,
};

beforeEach(() => {
  useFiltersStore.setState(INITIAL);
});

describe('initial state', () => {
  it('has correct defaults', () => {
    const state = useFiltersStore.getState();
    expect(state.ptoDays).toBe(22);
    expect(state.allowPastDays).toBe(false);
    expect(state.country).toBe('');
    expect(state.region).toBe('');
    expect(state.year).toBe(new Date().getFullYear());
    expect(state.carryOverMonths).toBe(1);
    expect(state.strategy).toBe(FilterStrategy.GROUPED);
  });
});

describe('setters', () => {
  it('setPtoDays never drops the budget below one day, whichever control wrote it', () => {
    useFiltersStore.getState().setPtoDays(0);
    expect(useFiltersStore.getState().ptoDays).toBe(MIN_PTO_DAYS);

    useFiltersStore.getState().setPtoDays(-5);
    expect(useFiltersStore.getState().ptoDays).toBe(MIN_PTO_DAYS);
  });

  it('setPtoDays stores whole days, since the accrual calculator computes fractions', () => {
    useFiltersStore.getState().setPtoDays(12.6);
    expect(useFiltersStore.getState().ptoDays).toBe(13);
  });

  it('setPtoDays updates ptoDays', () => {
    useFiltersStore.getState().setPtoDays(15);
    expect(useFiltersStore.getState().ptoDays).toBe(15);
  });

  it('setAllowPastDays updates allowPastDays', () => {
    useFiltersStore.getState().setAllowPastDays(true);
    expect(useFiltersStore.getState().allowPastDays).toBe(true);
  });

  it('setRegion updates region', () => {
    useFiltersStore.getState().setRegion('CAT');
    expect(useFiltersStore.getState().region).toBe('CAT');
  });

  it('setYear updates year', () => {
    useFiltersStore.getState().setYear(2025);
    expect(useFiltersStore.getState().year).toBe(2025);
  });

  it('setCarryOverMonths updates carryOverMonths', () => {
    useFiltersStore.getState().setCarryOverMonths(3);
    expect(useFiltersStore.getState().carryOverMonths).toBe(3);
  });

  it('setStrategy updates strategy', () => {
    useFiltersStore.getState().setStrategy(FilterStrategy.OPTIMIZED);
    expect(useFiltersStore.getState().strategy).toBe(FilterStrategy.OPTIMIZED);
  });
});

describe('setCountry', () => {
  it('sets the country', () => {
    useFiltersStore.getState().setCountry('ES');
    expect(useFiltersStore.getState().country).toBe('ES');
  });

  it('resets region when country changes', () => {
    useFiltersStore.setState({ region: 'CAT' });
    useFiltersStore.getState().setCountry('FR');
    expect(useFiltersStore.getState().region).toBe('');
  });
});

describe('persistence', () => {
  it('discards the year stored by a pre-partialize payload', async () => {
    mockStorageGetItem.mockResolvedValueOnce({
      state: { ptoDays: 15, carryOverMonths: 3, strategy: FilterStrategy.OPTIMIZED, year: 2020 },
      version: 1,
    });

    await useFiltersStore.persist.rehydrate();

    const state = useFiltersStore.getState();
    expect(state.year).toBe(new Date().getFullYear());
    expect(state.ptoDays).toBe(15);
    expect(state.carryOverMonths).toBe(3);
  });

  it('keeps the persisted filters of a current payload', async () => {
    mockStorageGetItem.mockResolvedValueOnce({
      state: { ptoDays: 8, country: 'IT', carryOverMonths: 2 },
      version: 2,
    });

    await useFiltersStore.persist.rehydrate();

    const state = useFiltersStore.getState();
    expect(state.ptoDays).toBe(8);
    expect(state.country).toBe('IT');
    expect(state.year).toBe(new Date().getFullYear());
  });
});

describe('onRehydrateStorage', () => {
  const runRehydrate = (error?: Error) => {
    const options = useFiltersStore.persist.getOptions();
    const listener = options.onRehydrateStorage?.(useFiltersStore.getState() as never);
    listener?.(useFiltersStore.getState() as never, error);
  };

  it('logs a rehydration failure without blocking the listener on the logging client', async () => {
    mockLogError.mockClear();

    runRehydrate(new Error('deobfuscate failed'));

    expect(mockLogError).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Error rehydrating filters store', expect.any(Error), {
        storeName: 'filters-store',
        hasState: true,
      })
    );
  });

  it('logs nothing when rehydration succeeds', async () => {
    mockLogError.mockClear();

    runRehydrate();

    await Promise.resolve();
    expect(mockLogError).not.toHaveBeenCalled();
  });
});

describe('resetToDefaults', () => {
  it('restores initial state', () => {
    useFiltersStore.getState().setPtoDays(5);
    useFiltersStore.getState().setCountry('ES');
    useFiltersStore.getState().setYear(2027);
    useFiltersStore.getState().resetToDefaults();
    const state = useFiltersStore.getState();
    expect(state.ptoDays).toBe(22);
    expect(state.country).toBe('');
    expect(state.year).toBe(new Date().getFullYear());
    expect(state.strategy).toBe(FilterStrategy.GROUPED);
  });
});
