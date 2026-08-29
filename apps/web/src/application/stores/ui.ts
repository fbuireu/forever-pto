import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
	donatePopoverOpen: boolean;
	donatePopoverIsOpening: boolean;
}

interface UIActions {
	openDonatePopover: () => void;
	closeDonatePopover: () => void;
	setDonatePopoverOpen: (isOpen: boolean) => void;
	clearDonatePopoverOpening: () => void;
}

type UIStore = UIState & UIActions;

const uiInitialState: UIState = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
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
		}),
		{ name: "ui-store" },
	),
);
