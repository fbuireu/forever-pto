"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useStoresReady } from "@ui/hooks/useStoresReady";
import { use, useEffect } from "react";
import { browser } from "react-dom";
import { useShallow } from "zustand/react/shallow";

function getUserCountryFromCookie() {
	const cookie = document.cookie.split("; ").find((row) => row.startsWith("user-country="));
	return cookie?.split("=")[1];
}

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
