import type { SearchParams } from "@const/types";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { Combobox } from "@ui/modules/components/core/combobox/Combobox";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { cache, memo } from "react";

export interface CountriesProps {
	country: SearchParams["country"];
	locale: Locale;
}

const getCachedCountries = cache(getCountries);

export const Countries = memo(async ({ country, locale }: CountriesProps) => {
	const t = await getTranslations({ locale, namespace: "filters.countries" });
	const countries = await getCachedCountries();

	return (
		<Combobox
			value={country}
			options={countries}
			type="country"
			className="w-full"
			label={t("label")}
			heading={t("heading")}
			placeholder={t("placeholder")}
			searchPlaceholder={t("searchPlaceholder")}
			notFoundText={t("notFound")}
		/>
	);
});
