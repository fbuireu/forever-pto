"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { Combobox } from "@modules/components/core/combobox/Combobox";
import { useFilterAction } from "@ui/hooks/useFilterAction/useFilterAction";
import { useTranslations } from "next-intl";

interface CountriesClientProps {
	countries: CountryDTO[];
	selectedCountry?: string;
}

export const CountriesClient = ({ countries, selectedCountry }: CountriesClientProps) => {
	const t = useTranslations("filters.countries");
	const { isPending } = useFilterAction();

	return (
		<div className={isPending ? "opacity-50" : ""}>
			<Combobox
				type="country"
				options={countries}
				value={selectedCountry}
				label={t("label")}
				heading={t("heading")}
				placeholder={t("placeholder")}
				searchPlaceholder={t("searchPlaceholder")}
				notFoundText={t("notFound")}
				disabled={isPending}
			/>
		</div>
	);
};
