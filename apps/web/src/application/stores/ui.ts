import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
	donatePopoverOpen: boolean;
	donatePopoverIsOpening: boolean;
	quickStartOpen: boolean;
}

interface UIActions {
	openDonatePopover: () => void;
	closeDonatePopover: () => void;
	setDonatePopoverOpen: (isOpen: boolean) => void;
	clearDonatePopoverOpening: () => void;
	openQuickStart: () => void;
	closeQuickStart: () => void;
	setQuickStartOpen: (isOpen: boolean) => void;
}

type UIStore = UIState & UIActions;

const uiInitialState: UIState = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
	quickStartOpen: false,
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

			openQuickStart: () => {
				set({ quickStartOpen: true });
			},

			closeQuickStart: () => {
				set({ quickStartOpen: false });
			},

			setQuickStartOpen: (isOpen: boolean) => {
				set({ quickStartOpen: isOpen });
			},
		}),
		{ name: "ui-store" },
	),
);
