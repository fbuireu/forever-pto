"use client";

import {
	activatePremium as activatePremiumAction,
	deactivatePremium as deactivatePremiumAction,
	isPremium as isPremiumAction,
} from "@application/actions/premium";
import { PREMIUM_PARAMS } from "@const/const";
import { PremiumContext } from "@ui/hooks/usePremium/usePremium";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";

interface PremiumProviderProps {
	children: ReactNode;
	isPremium: boolean;
}

export const PremiumProvider = ({ children, isPremium }: PremiumProviderProps) => {
	const pathname = usePathname();
	const [isPremiumUser, setIsPremiumUser] = useState(isPremium);
	const [isPending, startTransition] = useTransition();

	const activatePremium = async () => {
		startTransition(async () => {
			try {
				await activatePremiumAction(pathname);
				setIsPremiumUser(true);
			} catch (error) {}
		});
	};

	const deactivatePremium = async () => {
		startTransition(async () => {
			try {
				await deactivatePremiumAction(pathname);
				setIsPremiumUser(false);
			} catch (error) {}
		});
	};

	useEffect(() => {
		const verifyPremiumStatus = async () => {
			const isPremium = await isPremiumAction();
			if (isPremium !== isPremiumUser) {
				setIsPremiumUser(isPremium);
			}
		};

		verifyPremiumStatus();
		const interval = setInterval(verifyPremiumStatus, PREMIUM_PARAMS.CHECK_DELAY);

		return () => clearInterval(interval);
	}, [isPremiumUser]);

	return (
		<PremiumContext.Provider
			value={{
				isPremiumUser,
				isPremiumUserLoading: isPending,
				activatePremium,
				deactivatePremium,
			}}
		>
			{children}
		</PremiumContext.Provider>
	);
};
