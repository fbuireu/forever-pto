"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useCurrentYear } from "@ui/hooks/useCurrentYear";
import { useIsInView } from "@ui/hooks/useIsInView";
import dynamic from "next/dynamic";

const InlineQuickStartForm = dynamic(
	() => import("./InlineQuickStartForm").then((module) => ({ default: module.InlineQuickStartForm })),
	{ ssr: false },
);

const VIEW_MARGIN = "200px";

interface InlineQuickStartClientProps {
	countries: CountryDTO[];
	serverYear: number;
}

export const InlineQuickStartClient = ({ countries, serverYear }: InlineQuickStartClientProps) => {
	const currentYear = useCurrentYear(serverYear);
	const { ref, isInView } = useIsInView<HTMLDivElement>({
		ref: null,
		options: { inView: true, inViewOnce: true, inViewMargin: VIEW_MARGIN },
	});

	return (
		<div ref={ref} className="min-h-[188px] md:min-h-[104px]">
			{isInView && <InlineQuickStartForm countries={countries} currentYear={currentYear} />}
		</div>
	);
};
