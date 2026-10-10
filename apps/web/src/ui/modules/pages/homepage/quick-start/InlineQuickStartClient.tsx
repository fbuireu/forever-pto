"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useCurrentYear } from "@ui/hooks/useCurrentYear";
import { useIsInView } from "@ui/hooks/useIsInView";
import { Skeleton } from "boneyard-js/react";
import dynamic from "next/dynamic";
import { InlineQuickStartFixture } from "./InlineQuickStartFixture";

const InlineQuickStartSkeleton = () => (
	<Skeleton
		name="inline-quick-start"
		loading
		fixture={<InlineQuickStartFixture />}
		fallback={<InlineQuickStartFixture />}
		className="w-full"
	>
		<div />
	</Skeleton>
);

const InlineQuickStartForm = dynamic(
	() => import("./InlineQuickStartForm").then((module) => ({ default: module.InlineQuickStartForm })),
	{ ssr: false, loading: InlineQuickStartSkeleton },
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
		<div ref={ref} className="min-h-[360px] md:min-h-[168px] lg:min-h-[74px]">
			{isInView ? (
				<InlineQuickStartForm countries={countries} currentYear={currentYear} />
			) : (
				<InlineQuickStartSkeleton />
			)}
		</div>
	);
};
