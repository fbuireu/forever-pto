import { FilterStrategy } from '@domain/calendar/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFiltersStore } from './filters';

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
