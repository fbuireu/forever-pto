"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useFiltersStore } from "@application/stores/filters";
import { useLocationStore } from "@application/stores/location";
import { useStoresReady } from "@ui/hooks/useStoresReady";
import { getUserCountryFromCookie } from "@ui/utils/userCountry";
import { use, useEffect } from "react";
import { browser } from "react-dom";
import { useShallow } from "zustand/react/shallow";

interface StoresInitializerProps {
	countries: CountryDTO[];
}

export const StoresInitializer = ({ countries }: StoresInitializerProps) => {
	use(browser());
	const { areStoresReady } = useStoresReady();
	const userCountry = getUserCountryFromCookie();
	const { country, setCountry } = useFiltersStore(
		useShallow((state) => ({
			country: state.country,
			setCountry: state.setCountry,
		})),
	);
	const setCountries = useLocationStore((state) => state.setCountries);

	useEffect(() => {
		setCountries(countries);
	}, [countries, setCountries]);

	useEffect(() => {
		if (!areStoresReady || country || !userCountry) return;
		setCountry(userCountry);
	}, [areStoresReady, country, setCountry, userCountry]);

	return null;
};
