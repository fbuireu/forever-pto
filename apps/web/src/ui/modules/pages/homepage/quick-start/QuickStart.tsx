import { getCountries } from "@infrastructure/services/countries/getCountries";
import { getCurrentYear } from "@ui/utils/getCurrentYear";
import dynamic from "next/dynamic";
import type { Locale } from "next-intl";

const QuickStartDialog = dynamic(() => import("./QuickStartDialog").then((m) => m.QuickStartDialog));
const PremiumModal = dynamic(() =>
	import("@ui/modules/premium/PremiumModal").then((module) => ({ default: module.PremiumModal })),
);

interface QuickStartProps {
	locale: Locale;
}

export const QuickStart = async ({ locale }: QuickStartProps) => {
	const [countries, currentYear] = await Promise.all([getCountries(locale), getCurrentYear()]);

	return (
		<>
			<QuickStartDialog countries={countries} currentYear={currentYear} />
			<PremiumModal />
		</>
	);
};
