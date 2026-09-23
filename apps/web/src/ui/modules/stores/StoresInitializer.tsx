"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useStoresReady } from "@ui/hooks/useStoresReady";
import { getUserCountryFromCookie } from "@ui/utils/userCountry";
import { use, useEffect } from "react";
import { browser } from "react-dom";
import { useShallow } from "zustand/react/shallow";

export const StoresInitializer = () => {
	use(browser());
	const { areStoresReady } = useStoresReady();
	const userCountry = getUserCountryFromCookie();
	const { country, setCountry } = useFiltersStore(
		useShallow((state) => ({
			country: state.country,
			setCountry: state.setCountry,
		})),
	);

	useEffect(() => {
		if (!areStoresReady || country || !userCountry) return;
		setCountry(userCountry);
	}, [areStoresReady, country, setCountry, userCountry]);

	return null;
};
