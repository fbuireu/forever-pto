"use server";

import type { SearchParams } from "@const/types";
import { redirect } from "next/navigation";

export type FilterType = keyof SearchParams;

export async function updateSingleFilterAction(
	type: FilterType,
	value: string,
	currentPath: string,
	currentSearchParams: string,
) {
	const params = new URLSearchParams(currentSearchParams);

	if (value && value !== "false" && value !== "0") {
		params.set(type, value);
	} else {
		params.delete(type);
	}

	params.delete("page");

	const queryString = params.toString();
	redirect(`${currentPath}${queryString ? `?${queryString}` : ""}`);
}
