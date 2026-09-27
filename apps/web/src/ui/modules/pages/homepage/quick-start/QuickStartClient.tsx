"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useUIStore } from "@application/stores/ui";
import { useHasOpened } from "@ui/hooks/useHasOpened";
import dynamic from "next/dynamic";

const QuickStartDialog = dynamic(
	() => import("./QuickStartDialog").then((module) => ({ default: module.QuickStartDialog })),
	{ ssr: false },
);
const PremiumModal = dynamic(
	() => import("@ui/modules/premium/PremiumModal").then((module) => ({ default: module.PremiumModal })),
	{ ssr: false },
);

interface QuickStartClientProps {
	countries: CountryDTO[];
	currentYear: number;
}

export const QuickStartClient = ({ countries, currentYear }: QuickStartClientProps) => {
	const open = useUIStore((state) => state.quickStartOpen);
	const hasOpened = useHasOpened({ open });

	if (!hasOpened) return null;

	return (
		<>
			<QuickStartDialog countries={countries} currentYear={currentYear} />
			<PremiumModal />
		</>
	);
};
