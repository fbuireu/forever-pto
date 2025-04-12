import { isPremium as isPremiumAction } from "@application/actions/premium";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { PREMIUM_PARAMS } from "@const/const";
import { useEffect } from "react";

export function usePremiumStatusVerification() {
	const { isPremiumUser, setPremiumStatus } = usePremiumStore();

	useEffect(() => {
		const verifyPremiumStatus = async () => {
			try {
				const isPremium = await isPremiumAction();
				if (isPremium !== isPremiumUser) {
					setPremiumStatus(isPremium);
				}
			} catch (_) {}
		};

		void verifyPremiumStatus();

		const interval = setInterval(() => void verifyPremiumStatus(), PREMIUM_PARAMS.CHECK_DELAY);

		return () => clearInterval(interval);
	}, [isPremiumUser, setPremiumStatus]);
}
