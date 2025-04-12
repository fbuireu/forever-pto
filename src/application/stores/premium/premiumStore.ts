import {
	activatePremium as activatePremiumAction,
	deactivatePremium as deactivatePremiumAction,
} from "@application/actions/premium";
import { create } from "zustand";

interface PremiumState {
	isPremiumUser: boolean;
	isPremiumUserLoading: boolean;
	setPremiumStatus: (status: boolean) => void;
	activatePremium: () => Promise<void>;
	deactivatePremium: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>((set) => ({
	isPremiumUser: false,
	isPremiumUserLoading: false,

	setPremiumStatus: (status) => set({ isPremiumUser: status }),

	activatePremium: async () => {
		set({ isPremiumUserLoading: true });
		try {
			await activatePremiumAction(window.location.pathname);
			set({ isPremiumUser: true });
		} catch (_) {
		} finally {
			set({ isPremiumUserLoading: false });
		}
	},

	deactivatePremium: async () => {
		set({ isPremiumUserLoading: true });
		try {
			await deactivatePremiumAction(window.location.pathname);
			set({ isPremiumUser: false });
		} catch (_) {
		} finally {
			set({ isPremiumUserLoading: false });
		}
	},
}));
