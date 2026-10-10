"use client";

import { usePremiumStore } from "@application/stores/premium";
import { useEffect, useRef } from "react";

export function PremiumSessionSync() {
	const confirmActivation = usePremiumStore((state) => state.confirmActivation);
	const hasSynced = useRef(false);

	useEffect(() => {
		if (hasSynced.current) return;
		hasSynced.current = true;

		void confirmActivation();
	}, [confirmActivation]);

	return null;
}
