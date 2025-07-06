import type { LocaleKey } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { getTranslations } from "next-intl/server";
import { CardContent } from "../card/atoms/cardContent/CardContent";
import { CardHeader } from "../card/atoms/cardHeader/CardHeader";
import { CardTitle } from "../card/atoms/cardTitle/CardTitle";
import { Card } from "../card/Card";

interface LegendProps {
	locale: LocaleKey;
}

export const Legend = async ({ locale }: LegendProps) => {
	const t = await getTranslations({ locale, namespace: "legend" });

	return (
		<section className="mt-8 text-center text-sm w-full max-w-4xl mx-auto">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-2 flex flex-wrap justify-center gap-4">
						<div className="flex items-center">
							<div className="mr-2 h-4 w-4 rounded-sm border border-gray-300 bg-gray-500 dark:bg-gray-500 dark:border-gray-400" />
							<span>{t("today")}</span>
						</div>
						<div className="flex items-center">
							<div className="mr-2 h-4 w-4 rounded-sm border border-gray-300 bg-gray-200 dark:bg-gray-900 dark:border-gray-700" />
							<span>{t("weekends")}</span>
						</div>
						<div className="flex items-center">
							<div className="mr-2 h-4 w-4 rounded-sm border border-yellow-400 bg-yellow-300 dark:bg-yellow-400 dark:border-yellow-800" />
							<span>{t("holidays")}</span>
						</div>
						<div className="flex items-center">
							<div className="mr-2 h-4 w-4 rounded-sm border border-teal-500 bg-teal-400 dark:bg-teal-600 dark:border-teal-800" />
							<span>{t("suggested")}</span>
						</div>
						<div className="flex items-center">
							<div className="mr-2 h-4 w-4 rounded-sm border border-orange-500 bg-orange-400 dark:bg-orange-700 dark:border-orange-800" />
							<span>{t("alternatives")}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
};
