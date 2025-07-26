"use client";

import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { Combobox } from "@modules/components/core/combobox/Combobox";
import { useFilterAction } from "@ui/hooks/useFilterAction/useFilterAction";
import { useTranslations } from "next-intl";

interface RegionsClientProps {
	regions: RegionDTO[];
	selectedRegion?: string;
	userCountry?: CountryDTO;
}

export const RegionsClient = ({ regions, selectedRegion, userCountry }: RegionsClientProps) => {
	const t = useTranslations("filters.regions");
	const { isPending } = useFilterAction();
	const isDisabled = isPending || !userCountry || !regions?.length;
	return (
		<div className={isPending ? "opacity-50" : ""}>
			<Combobox
				type="region"
				value={selectedRegion}
				options={regions}
				disabled={isDisabled}
				className="w-full"
				label={t("label")}
				heading={t("heading", {
					hasCountry: userCountry?.label ? 1 : 0,
					country: userCountry?.label ?? "",
				})}
				placeholder={t("placeholder", {
					count: regions.length,
					country: userCountry?.label ?? "",
				})}
				searchPlaceholder={t("searchPlaceholder")}
				notFoundText={t("notFound")}
			/>
		</div>
	);
};
