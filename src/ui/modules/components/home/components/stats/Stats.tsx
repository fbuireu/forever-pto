import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { CardContent } from "@modules/components/core/card/atoms/cardContent/CardContent";
import { CardHeader } from "@modules/components/core/card/atoms/cardHeader/CardHeader";
import { CardTitle } from "@modules/components/core/card/atoms/cardTitle/CardTitle";
import { getBadgeVariant } from "@modules/components/home/components/stats/utils/getBadgeVariant";
import { Badge } from "@ui/modules/components/core/badge/Badge";
import { Card } from "@ui/modules/components/core/card/Card";
import { Separator } from "@ui/modules/components/core/separator/Separator";
import { useTranslations } from "next-intl";

interface StatsProps {
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
	stats: {
		country?: string;
		region?: string;
		nationalHolidays: number;
		regionalHolidays: number;
		totalHolidays: number;
		ptoDaysAvailable: number;
		ptoDaysUsed: number;
		effectiveDays: number;
		effectiveRatio: string;
	};
}

export const Stats = ({ stats, userCountry, userRegion }: StatsProps) => {
	const t = useTranslations("stats");

	if (!stats) {
		return null;
	}

	const hasHolidays = stats.totalHolidays > 0;

	return (
		<Card className="w-full max-w-4xl mb-6">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg">{t("title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-slate-700 dark:text-slate-300">
					<h3 className="font-medium text-base mb-2">{t("holidaysSummary.title")}</h3>
					{hasHolidays ? (
						<p>
							{userCountry?.label
								? t("holidaysSummary.withCountry", {
										country: userCountry.label,
										flag: userCountry.flag,
										nationalHolidays: stats.nationalHolidays,
									})
								: t("holidaysSummary.withoutCountry", {
										nationalHolidays: stats.nationalHolidays,
									})}
							{stats.regionalHolidays > 0 &&
								t("holidaysSummary.regionalPart", {
									regionalHolidays: stats.regionalHolidays,
									region: userRegion || t("holidaysSummary.defaultRegion"),
								})}
							{t("holidaysSummary.totalPart", {
								totalHolidays: stats.totalHolidays,
							})}
						</p>
					) : (
						<p>
							{userCountry?.label ? (
								<>
									{t("holidaysSummary.noHolidaysFound")}
									{userRegion && t("holidaysSummary.noRegionalHolidays", { region: userRegion })}
								</>
							) : (
								t("holidaysSummary.noCountryHolidays")
							)}
						</p>
					)}
				</div>

				{stats.totalHolidays > 0 && userCountry?.label && (
					<>
						<Separator />
						<div className="text-sm text-slate-700 dark:text-slate-300">
							<h3 className="font-medium text-base mb-3">{t("effectiveness.title")}</h3>
							{stats.ptoDaysUsed > 0 ? (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
											<p className="text-xs text-slate-500 dark:text-slate-400">{t("effectiveness.ptoUsed")}</p>
											<p className="text-2xl font-bold">{stats.ptoDaysUsed}</p>
										</div>
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
											<p className="text-xs text-slate-500 dark:text-slate-400">{t("effectiveness.totalFreeDays")}</p>
											<p className="text-2xl font-bold">{stats.effectiveDays}</p>
										</div>
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex flex-col items-start">
											<p className="text-xs text-slate-500 dark:text-slate-400">{t("effectiveness.ratio")}</p>
											<Badge
												variant={getBadgeVariant(stats.effectiveRatio)}
												className="mt-1 text-xl py-1 px-3 h-auto font-bold"
											>
												x{stats.effectiveRatio}
											</Badge>
										</div>
									</div>
									<div className="flex flex-col items-start">
										<span>
											{t("effectiveness.summaryStart", {
												ptoDaysAvailable: stats.ptoDaysAvailable,
												effectiveDays: stats.effectiveDays,
												effectiveRatio: stats.effectiveRatio,
											})}
											<Badge
												variant={getBadgeVariant(stats.effectiveRatio)}
												className="inline-flex items-center mx-1 font-medium"
											>
												x{stats.effectiveRatio}
											</Badge>
											{t("effectiveness.summaryEnd")}
										</span>
									</div>
								</>
							) : (
								<p>
									{t("effectiveness.calculating", {
										ptoDaysAvailable: stats.ptoDaysAvailable,
									})}
								</p>
							)}
						</div>
					</>
				)}

				{stats.ptoDaysAvailable === 0 && (
					<>
						<Separator />
						<div className="text-sm text-slate-700 dark:text-slate-300">
							<p className="italic">{t("noPtoDays")}</p>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};
