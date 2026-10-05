"use client";

import { ACTIVATION_FRESH, ACTIVATION_PARAM } from "@application/dto/payment/types";
import { usePremiumStore } from "@application/stores/premium";
import { useEffect, useRef } from "react";

const consumeMarker = (arrivedAt: string) => {
	if (window.location.href !== arrivedAt) return;

	const consumed = new URL(arrivedAt);
	consumed.searchParams.delete(ACTIVATION_PARAM);
	window.history.replaceState(null, "", consumed);
};

export function PremiumSessionSync() {
	const confirmActivation = usePremiumStore((state) => state.confirmActivation);
	const checkExistingSession = usePremiumStore((state) => state.checkExistingSession);
	const hasSynced = useRef(false);

	useEffect(() => {
		if (hasSynced.current) return;
		hasSynced.current = true;

		const arrivedAt = window.location.href;
		const redirected = new URL(arrivedAt).searchParams.get(ACTIVATION_PARAM) === ACTIVATION_FRESH;

		if (!redirected) {
			void checkExistingSession({ force: true });
			return;
		}

		void confirmActivation().then(() => consumeMarker(arrivedAt));
	}, [confirmActivation, checkExistingSession]);

	return null;
}
