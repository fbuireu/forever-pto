import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const DonateSource = {
	FLOATING: "floating",
	PLANNER_TOAST: "planner_toast",
	PRICING: "pricing",
} as const;

export type DonateSource = (typeof DonateSource)[keyof typeof DonateSource];

export const QuickStartSource = {
	NAV: "nav",
	HERO: "hero",
	PRICING: "pricing",
	CLOSING: "closing",
} as const;

export type QuickStartSource = (typeof QuickStartSource)[keyof typeof QuickStartSource];

interface UIState {
	donatePopoverOpen: boolean;
	donatePopoverIsOpening: boolean;
	quickStartOpen: boolean;
}

interface UIActions {
	openDonatePopover: (source: DonateSource) => void;
	closeDonatePopover: () => void;
	setDonatePopoverOpen: (isOpen: boolean) => void;
	clearDonatePopoverOpening: () => void;
	openQuickStart: (source: QuickStartSource) => void;
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

			openDonatePopover: (source: DonateSource) => {
				set({ donatePopoverOpen: true, donatePopoverIsOpening: true });
				track({ event: "donate_opened", properties: { source } });
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

			openQuickStart: (source: QuickStartSource) => {
				set({ quickStartOpen: true });
				track({ event: "quick_start_opened", properties: { source } });
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
