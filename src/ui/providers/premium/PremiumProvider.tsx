"use client";

import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { usePremiumStatusVerification } from "@ui/hooks/usePremiumStatusVerification/usePremiumStatusVerification";
import { type ReactNode, useEffect } from "react";

interface PremiumProviderProps {
	children: ReactNode;
	isPremium: boolean;
}

export const PremiumProvider = ({ children, isPremium }: PremiumProviderProps) => {
	const setPremiumStatus = usePremiumStore((state) => state.setPremiumStatus);

	useEffect(() => {
		setPremiumStatus(isPremium);
	}, [isPremium, setPremiumStatus]);

	usePremiumStatusVerification();

	return <>{children}</>;
};
