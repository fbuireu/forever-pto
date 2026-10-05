"use client";

import { ACTIVATION_FRESH, ACTIVATION_PARAM } from "@application/dto/payment/types";
import { usePremiumStore } from "@application/stores/premium";
import { useEffect, useRef } from "react";

export function PremiumSessionSync() {
	const confirmActivation = usePremiumStore((state) => state.confirmActivation);
	const checkExistingSession = usePremiumStore((state) => state.checkExistingSession);
	const hasSynced = useRef(false);

	useEffect(() => {
		if (hasSynced.current) return;
		hasSynced.current = true;

		const address = new URL(window.location.href);

		if (address.searchParams.get(ACTIVATION_PARAM) !== ACTIVATION_FRESH) {
			void checkExistingSession(true);
			return;
		}

		address.searchParams.delete(ACTIVATION_PARAM);
		window.history.replaceState(null, "", address);
		void confirmActivation();
	}, [confirmActivation, checkExistingSession]);

	return null;
}
