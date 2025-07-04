import { isPremium as isPremiumAction } from "@application/actions/premium";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { useCallback, useEffect } from "react";

export function usePremiumStatusVerification() {
	const { isPremiumUser, setPremiumStatus } = usePremiumStore();

	const verifyPremiumStatus = useCallback(async () => {
		try {
			const isPremium = await isPremiumAction();
			if (isPremium !== isPremiumUser) {
				setPremiumStatus(isPremium);
			}
		} catch (_) {}
	}, [isPremiumUser, setPremiumStatus]);

	useEffect(() => {
		void verifyPremiumStatus();

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				void verifyPremiumStatus();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [verifyPremiumStatus]);
}
