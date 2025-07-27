import { isPremium as isPremiumAction } from "@application/actions/premium";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { useCallback, useEffect, useRef } from "react";

const VERIFICATION_INTERVAL = 30000; // 30 segundos
const DEBOUNCE_DELAY = 1000; // 1 segundo

export function usePremiumStatusVerification() {
	const { isPremiumUser, setPremiumStatus } = usePremiumStore();
	const lastVerificationRef = useRef<number>(0);
	const debounceTimeoutRef = useRef<NodeJS.Timeout>();

	const verifyPremiumStatus = useCallback(async () => {
		const now = Date.now();

		// Evitar verificaciones muy frecuentes
		if (now - lastVerificationRef.current < VERIFICATION_INTERVAL) {
			return;
		}

		try {
			const isPremium = await isPremiumAction();
			if (isPremium !== isPremiumUser) {
				setPremiumStatus(isPremium);
			}
			lastVerificationRef.current = now;
		} catch (_) {
			// Silenciar errores para no afectar UX
		}
	}, [isPremiumUser, setPremiumStatus]);

	const debouncedVerification = useCallback(() => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			void verifyPremiumStatus();
		}, DEBOUNCE_DELAY);
	}, [verifyPremiumStatus]);

	useEffect(() => {
		// Verificación inicial solo si no tenemos estado
		if (isPremiumUser === undefined) {
			void verifyPremiumStatus();
		}

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				debouncedVerification();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, [debouncedVerification, verifyPremiumStatus, isPremiumUser]);
}
