"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useUIStore } from "@application/stores/ui";
import { useCurrentYear } from "@ui/hooks/useCurrentYear";
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
	serverYear: number;
}

export const QuickStartClient = ({ countries, serverYear }: QuickStartClientProps) => {
	const open = useUIStore((state) => state.quickStartOpen);
	const hasOpened = useHasOpened({ open });
	const currentYear = useCurrentYear({ serverYear });

	if (!hasOpened) return null;

	return (
		<>
			<QuickStartDialog countries={countries} currentYear={currentYear} />
			<PremiumModal />
		</>
	);
};
