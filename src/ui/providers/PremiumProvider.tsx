"use client";

import {
    activatePremium as activatePremiumAction,
    checkPremiumStatus,
    deactivatePremium as deactivatePremiumAction,
} from '@application/actions/premium';
import { usePathname } from 'next/navigation';
import React, { createContext, ReactNode, useContext, useEffect, useState, useTransition } from 'react';

interface PremiumContextType {
	isPremium: boolean;
	isPremiumLoading: boolean;
	activatePremium: () => Promise<void>;
	deactivatePremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
	children: ReactNode;
	initialPremiumStatus: boolean;
}

export const PremiumProvider = ({ children, initialPremiumStatus }: PremiumProviderProps) => {
	const pathname = usePathname();
	const [isPremium, setIsPremium] = useState(initialPremiumStatus);
	const [isPending, startTransition] = useTransition();

	const activatePremium = async () => {
		startTransition(async () => {
			try {
				await activatePremiumAction(pathname);
				setIsPremium(true);
			} catch (error) {
				console.error("Error al activar premium:", error);
			}
		});
	};

	const deactivatePremium = async () => {
		startTransition(async () => {
			try {
				await deactivatePremiumAction(pathname);
				setIsPremium(false);
			} catch (error) {
				console.error("Error al desactivar premium:", error);
			}
		});
	};

	useEffect(() => {
		const verifyPremiumStatus = async () => {
			const status = await checkPremiumStatus();
			if (status !== isPremium) {
				setIsPremium(status);
			}
		};

		verifyPremiumStatus();
		const interval = setInterval(verifyPremiumStatus, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, [isPremium]);

	return (
		<PremiumContext.Provider
			value={{
				isPremium,
				isPremiumLoading: isPending,
				activatePremium,
				deactivatePremium,
			}}
		>
			{children}
		</PremiumContext.Provider>
	);
};

export const usePremium = () => {
	const context = useContext(PremiumContext);
	if (context === undefined) {
		throw new Error("usePremium debe usarse dentro de un PremiumProvider");
	}
	return context;
};
