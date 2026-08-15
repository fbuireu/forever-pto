import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL, getCurrencyForLocale } from '@ui/utils/currencies';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  donatePopoverOpen: boolean;
  donatePopoverIsOpening: boolean;
  currency: string;
  currencySymbol: string;
}

interface UIActions {
  openDonatePopover: () => void;
  closeDonatePopover: () => void;
  setDonatePopoverOpen: (isOpen: boolean) => void;
  clearDonatePopoverOpening: () => void;
  getCurrencyFromLocale: (locale: Locale) => void;
}

type UIStore = UIState & UIActions;

const uiInitialState: UIState = {
  donatePopoverOpen: false,
  donatePopoverIsOpening: false,
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      ...uiInitialState,

      openDonatePopover: () => {
        set({ donatePopoverOpen: true, donatePopoverIsOpening: true });
        setTimeout(() => set({ donatePopoverIsOpening: false }), 0);
      },

      closeDonatePopover: () => {
        set({ donatePopoverOpen: false, donatePopoverIsOpening: false });
      },

      setDonatePopoverOpen: (isOpen: boolean) => {
        set({ donatePopoverOpen: isOpen, donatePopoverIsOpening: false });
      },

      clearDonatePopoverOpening: () => {
        set({ donatePopoverIsOpening: false });
      },

      getCurrencyFromLocale: (locale: Locale) => {
        try {
          set(getCurrencyForLocale(locale));
        } catch {
          set({ currency: DEFAULT_CURRENCY, currencySymbol: DEFAULT_CURRENCY_SYMBOL });
        }
      },
    }),
    { name: 'ui-store' }
  )
);
