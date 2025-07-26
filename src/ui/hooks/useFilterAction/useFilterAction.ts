"use client";

import { type FilterType, updateSingleFilterAction } from "@application/actions/updateFilter";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function useFilterAction() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const updateFilter = (type: FilterType, value: string) => {
		startTransition(async () => {
			await updateSingleFilterAction(type, value, pathname, searchParams.toString());
		});
	};

	return {
		updateFilter,
		isPending,
	};
}
