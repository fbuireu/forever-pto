import { PremiumFeatureId } from "@application/stores/premium";
import { useTranslations } from "next-intl";

const LABEL_KEY = {
	[PremiumFeatureId.EDIT_HOLIDAYS]: "holidayRow.editHolidays",
	[PremiumFeatureId.SELECT_HOLIDAY]: "premium.selectHoliday",
	[PremiumFeatureId.SELECT_ALL_HOLIDAYS]: "premium.selectAllHolidays",
	[PremiumFeatureId.CUSTOM_HOLIDAYS]: "holidaysTable.customHolidaysFeature",
	[PremiumFeatureId.ADVANCED_METRICS]: "summary.metrics.advancedMetrics",
	[PremiumFeatureId.YEAR_SUMMARY]: "summary.yearSummary.feature",
	[PremiumFeatureId.DAYS_OFF_COMPOSITION]: "charts.daysOffCompositionFeature",
	[PremiumFeatureId.QUARTER_DISTRIBUTION]: "charts.quarterDistributionFeature",
	[PremiumFeatureId.LONG_BLOCKS]: "charts.longBlocksFeature",
	[PremiumFeatureId.ANNUAL_TIMELINE]: "charts.annualTimelineFeature",
	[PremiumFeatureId.ALLOW_PAST_DAYS]: "sidebar.allowPastDays.title",
	[PremiumFeatureId.CARRY_OVER_MONTHS]: "sidebar.carryOverMonths.title",
	[PremiumFeatureId.CALENDAR_EXPORT]: "calendarExport.title",
} as const satisfies Record<PremiumFeatureId, string>;

export const usePremiumFeatureLabel = () => {
	const t = useTranslations();

	return (feature: PremiumFeatureId) => t(LABEL_KEY[feature]);
};
