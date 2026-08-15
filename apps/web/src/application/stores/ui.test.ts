import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from '@ui/utils/currencies';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from './ui';

vi.mock('@ui/utils/currencies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ui/utils/currencies')>();
  return {
    ...actual,
    getCurrencyForLocale: vi
      .fn()
      .mockReturnValue({ currency: actual.DEFAULT_CURRENCY, currencySymbol: actual.DEFAULT_CURRENCY_SYMBOL }),
  };
});

const INITIAL = {
  donatePopoverOpen: false,
  donatePopoverIsOpening: false,
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
};

beforeEach(() => {
  useUIStore.setState(INITIAL);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('donate popover', () => {
  it('initial state has popover closed', () => {
    const { donatePopoverOpen, donatePopoverIsOpening } = useUIStore.getState();
    expect(donatePopoverOpen).toBe(false);
    expect(donatePopoverIsOpening).toBe(false);
  });

  it('openDonatePopover sets open and isOpening to true', () => {
    useUIStore.getState().openDonatePopover();
    const { donatePopoverOpen, donatePopoverIsOpening } = useUIStore.getState();
    expect(donatePopoverOpen).toBe(true);
    expect(donatePopoverIsOpening).toBe(true);
  });

  it('openDonatePopover clears isOpening after the next tick', () => {
    useUIStore.getState().openDonatePopover();
    vi.runAllTimers();
    expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
    expect(useUIStore.getState().donatePopoverOpen).toBe(true);
  });

  it('closeDonatePopover sets both flags to false', () => {
    useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
    useUIStore.getState().closeDonatePopover();
    expect(useUIStore.getState().donatePopoverOpen).toBe(false);
    expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
  });

  it('setDonatePopoverOpen(true) opens and clears isOpening', () => {
    useUIStore.getState().setDonatePopoverOpen(true);
    expect(useUIStore.getState().donatePopoverOpen).toBe(true);
    expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
  });

  it('setDonatePopoverOpen(false) closes and clears isOpening', () => {
    useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
    useUIStore.getState().setDonatePopoverOpen(false);
    expect(useUIStore.getState().donatePopoverOpen).toBe(false);
    expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
  });

  it('clearDonatePopoverOpening clears isOpening without touching open', () => {
    useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
    useUIStore.getState().clearDonatePopoverOpening();
    expect(useUIStore.getState().donatePopoverOpen).toBe(true);
    expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
  });
});

describe('getCurrencyFromLocale', () => {
  it('applies the result of getCurrencyForLocale to the store', async () => {
    const { getCurrencyForLocale } = await import('@ui/utils/currencies');
    vi.mocked(getCurrencyForLocale).mockReturnValueOnce({ currency: 'USD', currencySymbol: '$' });

    useUIStore.getState().getCurrencyFromLocale('en-US');
    expect(useUIStore.getState().currency).toBe('USD');
    expect(useUIStore.getState().currencySymbol).toBe('$');
  });

  it('falls back to EUR / € when getCurrencyForLocale throws', async () => {
    const { getCurrencyForLocale } = await import('@ui/utils/currencies');
    vi.mocked(getCurrencyForLocale).mockImplementationOnce(() => {
      throw new Error('unsupported');
    });

    useUIStore.getState().getCurrencyFromLocale('en');
    expect(useUIStore.getState().currency).toBe('EUR');
    expect(useUIStore.getState().currencySymbol).toBe('€');
  });
});
