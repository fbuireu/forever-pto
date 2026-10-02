"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useStoresReady } from "@ui/hooks/useStoresReady";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";

interface SiteTitleYearProps {
	serverYear: number;
}

export const SiteTitleYear = ({ serverYear }: SiteTitleYearProps) => {
	const year = useFiltersStore((state) => state.year);
	const { areStoresReady } = useStoresReady();

	return (
		<SlidingNumber
			number={areStoresReady ? year : serverYear}
			className="font-serif font-normal text-[1.1em] text-muted-foreground"
		/>
	);
};
