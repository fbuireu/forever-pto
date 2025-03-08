import type { SearchParams } from "@/app/page";
import { PtoDaysInput } from "@/components/ui/PtoDaysInput";
import { YearSelect } from "@/components/ui/YearSelect";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type ReactNode, Suspense } from "react";
import CountryCombobox from "./CountryCombobox";
import RegionCombobox from "./RegionCombobox";

export type FiltersProps = SearchParams;

export default function Filters({
	country,
	region,
	year,
	ptoDays,
	// allowPastDays,
}: FiltersProps) {
	return (
		<header className="mb-4 flex w-full flex-col gap-4">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<h1 className="text-2xl font-bold">Optimizador de PTO</h1>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Badge variant="outline">Días PTO disponibles: {ptoDays}</Badge>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 md:grid-cols-4">
				<PtoDaysInput ptoDays={ptoDays} />
				<div className="flex w-full flex-col gap-1">
					<Suspense fallback={(<Skeleton className="h-10 w-full rounded" />) as ReactNode}>
						<CountryCombobox country={country} />
					</Suspense>
					<p className="pl-2 text-xs text-gray-500">Inferred from your IP. Feel free to change it</p>
				</div>

				<div className="flex w-full flex-col gap-1">
					<Suspense fallback={(<Skeleton className="h-10 w-full rounded" />) as ReactNode}>
						<RegionCombobox country={country} region={region} />
					</Suspense>
				</div>
				<YearSelect year={year} />
			</div>

			<div className="flex items-center gap-2 rounded bg-blue-50 p-3">{/* Contenido comentado */}</div>
		</header>
	);
}
