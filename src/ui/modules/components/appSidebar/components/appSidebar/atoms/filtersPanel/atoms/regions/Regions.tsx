import type { SearchParams } from "@const/types";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { getRegions } from "@infrastructure/services/region/getRegions/getRegions";
import { Combobox } from "@ui/modules/components/core/combobox/Combobox";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

const getCachedCountries = cache(getCountries);
const getCachedRegions = cache(getRegions);

export interface RegionsProps {
	country: SearchParams["country"];
	region: SearchParams["region"];
	locale: Locale;
}

export const Regions = async ({ country, region, locale }: RegionsProps) => {
	const t = await getTranslations({ locale, namespace: "filters.regions" });
	const countries = await getCachedCountries();
	const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
	const regions = await getCachedRegions(userCountry?.value);
	const isDisabled = !userCountry || !regions?.length;

	return (
		<Combobox
			value={region}
			options={regions}
			type="region"
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
	);
};
