import { getCountries } from "@infrastructure/services/countries/getCountries";
import { getCurrentYear } from "@ui/utils/getCurrentYear";
import type { Locale } from "next-intl";
import { QuickStartClient } from "./QuickStartClient";

interface QuickStartProps {
	locale: Locale;
}

export const QuickStart = async ({ locale }: QuickStartProps) => {
	const [countries, currentYear] = await Promise.all([getCountries(locale), getCurrentYear()]);

	return <QuickStartClient countries={countries} currentYear={currentYear} />;
};
