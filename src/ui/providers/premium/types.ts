export interface PremiumContextType {
	isPremiumUser: boolean;
	isPremiumUserLoading: boolean;
	activatePremium: () => Promise<void>;
	deactivatePremium: () => Promise<void>;
}
